/**
 * Skia-based frame renderer
 * Renders captions to RGBA frames using Skia Canvas
 */

import { Canvas, FontLibrary } from 'skia-canvas';
import { FrameBuffer } from './frameBuffer.js';
import { createGradient, parseColor, parseTextShadow } from '../utils/cssToSkia.js';

/**
 * Skia Renderer class
 * Handles all rendering operations using Skia Canvas
 */
export class SkiaRenderer {
  /**
   * Create a new Skia renderer
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {boolean} debugMode - Enable debug logging
   */
  constructor(width, height, debugMode = false) {
    this.width = width;
    this.height = height;
    this.debugMode = debugMode;
    this.canvas = new Canvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.frameBuffer = new FrameBuffer(width, height);
    
    // Cache for empty frames (no captions)
    this._emptyFrameBuffer = null;
    // Reusable buffer for getImageData to avoid creating new buffers
    this._reusableBuffer = null;
    // Track if we've logged the fallback message
    this._hasLoggedFallback = false;
    this._hasLoggedSurfaceWarning = false;
  }

  /**
   * Clear the canvas
   */
  clear() {
    // Fill with transparent black instead of clearRect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw a rounded rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Border radius
   * @param {Object} color - Color object {r, g, b, a}
   */
  drawRoundedRect(x, y, width, height, radius, color) {
    this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
    this.ctx.beginPath();
    // Use roundRect if available, otherwise draw manually
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(x, y, width, height, radius);
    } else {
      // Fallback: draw rounded rectangle manually
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
    }
    this.ctx.fill();
  }

  /**
   * Draw a gradient rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Border radius
   * @param {Object} gradient - Gradient configuration
   */
  drawGradientRect(x, y, width, height, radius, gradient) {
    if (!gradient) return;

    let grd;
    if (gradient.type === 'linear') {
      grd = this.ctx.createLinearGradient(
        gradient.startX,
        gradient.startY,
        gradient.endX,
        gradient.endY
      );
    } else if (gradient.type === 'radial') {
      grd = this.ctx.createRadialGradient(
        gradient.centerX,
        gradient.centerY,
        0,
        gradient.centerX,
        gradient.centerY,
        gradient.radius
      );
    } else {
      return;
    }

    // Add color stops
    const stopCount = gradient.colors.length;
    gradient.colors.forEach((color, index) => {
      const stop = index / (stopCount - 1 || 1);
      grd.addColorStop(stop, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`);
    });

    this.ctx.fillStyle = grd;
    this.ctx.beginPath();
    // Use roundRect if available, otherwise draw manually
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(x, y, width, height, radius);
    } else {
      // Fallback: draw rounded rectangle manually
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
    }
    this.ctx.fill();
  }

  /**
   * Apply blur effect (backdrop filter)
   * @param {number} blurRadius - Blur radius in pixels
   */
  applyBlur(blurRadius) {
    if (blurRadius > 0) {
      this.ctx.filter = `blur(${blurRadius}px)`;
    }
  }

  /**
   * Draw caption background box
   * @param {Object} transform - Container transform
   * @param {Object} styles - Style configuration
   * @param {Object} bounds - Bounding box {x, y, width, height}
   */
  drawCaptionBox(transform, styles, bounds) {
    // Save context
    this.ctx.save();

    // Apply container transform
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    this.ctx.translate(centerX, centerY);
    this.ctx.scale(transform.scale, transform.scale);
    this.ctx.rotate((transform.rotation * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.translate(transform.translateX, transform.translateY);
    this.ctx.globalAlpha = transform.opacity;

    // Draw background
    const bgColor = styles.backgroundColor;
    const borderRadius = styles.borderRadius;

    // Apply backdrop blur if needed
    if (styles.backdropBlur) {
      // Note: Skia canvas doesn't support backdrop-filter directly
      // We'll apply a blur effect to the background
      this.applyBlur(styles.backdropBlur);
    }

    // Draw background with gradient or solid color
    if (styles.gradient) {
      const gradient = createGradient(styles.gradient, this.width, this.height);
      this.drawGradientRect(bounds.x, bounds.y, bounds.width, bounds.height, borderRadius, gradient);
    } else {
      this.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, borderRadius, bgColor);
    }

    // Draw border if configured
    if (styles.border) {
      this.ctx.strokeStyle = `rgba(${styles.border.color.r}, ${styles.border.color.g}, ${styles.border.color.b}, ${styles.border.color.a / 255})`;
      this.ctx.lineWidth = styles.border.width;
      this.ctx.beginPath();
      if (typeof this.ctx.roundRect === 'function') {
        this.ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, borderRadius);
      } else {
        // Fallback: draw rounded rectangle manually
        this.ctx.moveTo(bounds.x + borderRadius, bounds.y);
        this.ctx.lineTo(bounds.x + bounds.width - borderRadius, bounds.y);
        this.ctx.quadraticCurveTo(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + borderRadius);
        this.ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - borderRadius);
        this.ctx.quadraticCurveTo(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - borderRadius, bounds.y + bounds.height);
        this.ctx.lineTo(bounds.x + borderRadius, bounds.y + bounds.height);
        this.ctx.quadraticCurveTo(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - borderRadius);
        this.ctx.lineTo(bounds.x, bounds.y + borderRadius);
        this.ctx.quadraticCurveTo(bounds.x, bounds.y, bounds.x + borderRadius, bounds.y);
        this.ctx.closePath();
      }
      this.ctx.stroke();
    }

    // Reset filter
    this.ctx.filter = 'none';

    // Restore context
    this.ctx.restore();
  }

  /**
   * Get effective font size (handle null by calculating from dimensions)
   * @param {Object} styles - Style configuration
   * @returns {number} Font size in pixels
   */
  getFontSize(styles) {
    if (styles.fontSize !== null && styles.fontSize !== undefined) {
      return styles.fontSize;
    }
    // Calculate from video dimensions (default: ~4% of height)
    return Math.round(this.height * 0.04);
  }

  /**
   * Measure text dimensions
   * @param {string} text - Text to measure
   * @param {Object} styles - Style configuration
   * @returns {Object} Text metrics {width, height}
   */
  measureText(text, styles) {
    const fontSize = this.getFontSize(styles);
    this.ctx.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
    const metrics = this.ctx.measureText(text);
    return {
      width: metrics.width,
      height: fontSize * (styles.lineHeight || 1.4) // Use lineHeight from styles
    };
  }

  /**
   * Draw a word with transform
   * @param {string} text - Word text
   * @param {Object} transform - Word transform
   * @param {Object} styles - Style configuration
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} wordState - Word state (active, next, etc.)
   */
  drawWord(text, transform, styles, x, y, wordState = {}) {
    // Save context
    this.ctx.save();

    // Ensure opacity is visible - words should always be visible when rendered
    let opacity = transform.opacity !== undefined ? transform.opacity : 1;
    // If opacity is too low, make it visible (but don't force to 1, allow animations)
    if (opacity > 0 && opacity < 0.1) {
      opacity = 0.1; // Minimum visibility
    }

    // Apply word state transform (from splitTextOptions)
    let scale = transform.scale !== undefined ? transform.scale : 1;
    if (wordState.active && wordState.activeStyles && wordState.activeStyles.transform) {
      const scaleMatch = wordState.activeStyles.transform.match(/scale\(([\d.]+)\)/);
      if (scaleMatch) {
        scale *= parseFloat(scaleMatch[1]);
      }
    }

    // Apply word transform
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.rotate((transform.rotation || 0) * Math.PI / 180);
    this.ctx.translate(transform.translateX || 0, transform.translateY || 0);

    // Apply opacity (combine transform opacity with word state opacity)
    if (wordState.next && wordState.nextStyles && wordState.nextStyles.opacity !== undefined) {
      opacity *= wordState.nextStyles.opacity;
    }
    this.ctx.globalAlpha = Math.max(0.1, opacity); // Ensure at least slightly visible

    // Determine word styles based on state
    let wordColor = styles.color;
    let wordFontWeight = styles.fontWeight;
    let wordTextShadow = styles.textShadow;

    if (wordState.active && wordState.activeStyles) {
      if (wordState.activeStyles.color) {
        wordColor = parseColor(wordState.activeStyles.color);
      }
      if (wordState.activeStyles.fontWeight) {
        wordFontWeight = wordState.activeStyles.fontWeight;
      }
      if (wordState.activeStyles.textShadow) {
        wordTextShadow = parseTextShadow(wordState.activeStyles.textShadow);
      }
    } else if (wordState.next && wordState.nextStyles) {
      if (wordState.nextStyles.color) {
        wordColor = parseColor(wordState.nextStyles.color);
      }
    }

    // Set font - use system fonts that support Unicode
    const fontSize = this.getFontSize(styles);
    // Use a font that supports Hindi/Unicode - try DejaVu Sans or Noto Sans which support Hindi
    // Fallback to system default sans-serif which should support Unicode
    let fontFamily = styles.fontFamily;
    if (fontFamily.includes('SF Pro') || !fontFamily) {
      // Use system default sans-serif which typically supports Unicode
      fontFamily = 'sans-serif';
    }
    this.ctx.font = `${wordFontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle'; // Center text vertically
    this.ctx.fillStyle = `rgba(${wordColor.r}, ${wordColor.g}, ${wordColor.b}, ${wordColor.a / 255})`;

    // Debug first word drawing
      if (this.debugMode && this._firstWordDrawn === undefined) {
        this._firstWordDrawn = true;
        console.log(`[DEBUG] Drawing first word: "${text}"`);
        console.log(`[DEBUG] Font: ${this.ctx.font}`);
        console.log(`[DEBUG] Fill style: ${this.ctx.fillStyle}`);
        console.log(`[DEBUG] Position: (${x}, ${y}), Opacity: ${opacity}`);
      }

    // Apply text shadow if configured
    const shadowToUse = wordTextShadow || styles.textShadow;
    if (shadowToUse) {
      this.ctx.shadowOffsetX = shadowToUse.offsetX || 0;
      this.ctx.shadowOffsetY = shadowToUse.offsetY || 0;
      this.ctx.shadowBlur = shadowToUse.blur || 0;
      this.ctx.shadowColor = `rgba(${shadowToUse.color.r}, ${shadowToUse.color.g}, ${shadowToUse.color.b}, ${shadowToUse.color.a / 255})`;
    }

    // Draw text (at 0,0 since we already translated to the position)
    this.ctx.fillText(text, 0, 0);

    // Reset shadow
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.shadowBlur = 0;

    // Restore context
    this.ctx.restore();
  }

  /**
   * Calculate caption bounds based on words
   * @param {Array<Object>} words - Array of word objects with transforms
   * @param {Object} styles - Style configuration
   * @returns {Object} Bounding box {x, y, width, height}
   */
  calculateCaptionBounds(words, styles) {
    if (words.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Calculate total text width
    let totalTextWidth = 0;
    for (const word of words) {
      const metrics = this.measureText(word.text, styles);
      totalTextWidth += metrics.width * word.transform.scale;
    }
    if (words.length > 1) {
      totalTextWidth += styles.wordSpacing * (words.length - 1);
    }

    const baseY = this.height * 0.85; // Near bottom of screen
    const startX = (this.width / 2) - (totalTextWidth / 2);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let currentX = startX;

    for (const word of words) {
      const metrics = this.measureText(word.text, styles);
      const wordWidth = metrics.width * word.transform.scale;
      const wordHeight = metrics.height * word.transform.scale;

      const wordX = currentX + (wordWidth / 2) + word.transform.translateX;
      const wordY = baseY + word.transform.translateY;

      minX = Math.min(minX, wordX - wordWidth / 2);
      minY = Math.min(minY, wordY - wordHeight);
      maxX = Math.max(maxX, wordX + wordWidth / 2);
      maxY = Math.max(maxY, wordY);

      // Move to next word position
      currentX += wordWidth + styles.wordSpacing;
    }

    // Add padding
    const padding = styles.padding;
    const width = (maxX - minX) + padding.left + padding.right;
    const height = (maxY - minY) + padding.top + padding.bottom;
    const x = minX - padding.left;
    const y = minY - padding.top;

    return { x, y, width, height };
  }

  /**
   * Render a complete caption
   * @param {Object} caption - Caption object with words and transforms
   * @param {Object} styles - Style configuration
   * @param {number} currentTime - Current time in seconds
   */
  renderCaption(caption, styles, currentTime) {
    if (!caption.words || caption.words.length === 0) {
      console.warn('[WARN] renderCaption called with no words');
      return;
    }

    // Always log first few caption renders to debug
    if (this._captionRenderCount === undefined) {
      this._captionRenderCount = 0;
    }
    this._captionRenderCount++;
    if (this._captionRenderCount <= 5) {
      console.log(`[DEBUG] Rendering caption #${this._captionRenderCount} with ${caption.words.length} words at time ${currentTime.toFixed(2)}s`);
      console.log(`[DEBUG] First word: "${caption.words[0].text}", opacity: ${caption.words[0].transform?.opacity ?? 'N/A'}`);
    }

    // Ensure container is visible
    if (caption.containerTransform && caption.containerTransform.opacity === 0) {
      caption.containerTransform.opacity = 1;
    }

    // Calculate caption bounds
    const bounds = this.calculateCaptionBounds(caption.words, styles);

    if (this.debugMode && this._captionRenderCount <= 3) {
      console.log(`[DEBUG] Caption bounds: x=${bounds.x.toFixed(1)}, y=${bounds.y.toFixed(1)}, w=${bounds.width.toFixed(1)}, h=${bounds.height.toFixed(1)}`);
    }

    // Draw background box
    this.drawCaptionBox(caption.containerTransform, styles, bounds);

    // Determine active and next words based on timing
    let activeWordIndex = -1;
    let nextWordIndex = -1;

    if (styles.splitTextOptions) {
      for (let i = 0; i < caption.words.length; i++) {
        const word = caption.words[i];
        if (currentTime >= word.start && currentTime <= word.end) {
          activeWordIndex = i;
          if (i + 1 < caption.words.length) {
            nextWordIndex = i + 1;
          }
          break;
        } else if (currentTime < word.start) {
          nextWordIndex = i;
          break;
        }
      }
    }

    // Calculate total text width to center the caption
    let totalTextWidth = 0;
    for (let i = 0; i < caption.words.length; i++) {
      const word = caption.words[i];
      const metrics = this.measureText(word.text, styles);
      totalTextWidth += metrics.width;
      if (i < caption.words.length - 1) {
        totalTextWidth += styles.wordSpacing;
      }
    }

    // Draw words - start from center and work outward
    let currentX = (this.width / 2) - (totalTextWidth / 2);
    const baseY = this.height * 0.85;

    for (let i = 0; i < caption.words.length; i++) {
      const word = caption.words[i];

      // For active captions, show all words (even if animation hasn't started)
      // Only skip if word is completely before its time
      const isWordInTimeRange = currentTime >= word.start && currentTime <= word.end;
      const isWordFuture = currentTime < word.start;

      // If word is in future and opacity is 0, we can skip it
      // But if caption is active, show all words with at least some visibility
      let wordOpacity = word.transform?.opacity ?? 1;
      if (isWordFuture && wordOpacity === 0) {
        // Skip future words that are completely invisible
        // But still account for spacing
        const metrics = this.measureText(word.text, styles);
        currentX += metrics.width + styles.wordSpacing;
        continue;
      }

      // TEMPORARY: Make all words in active caption fully visible to debug
      // TODO: Restore proper animation after debugging
      if (isWordInTimeRange) {
        wordOpacity = 1; // Force fully visible for debugging
        word.transform.opacity = 1;
      } else if (!isWordFuture) {
        // Word has passed, keep it visible
        wordOpacity = Math.max(0.3, wordOpacity);
        word.transform.opacity = wordOpacity;
      }

      const metrics = this.measureText(word.text, styles);
      const wordX = currentX + (metrics.width / 2); // Center of the word
      const wordY = baseY;

      // Determine word state
      const wordState = {};
      if (i === activeWordIndex && styles.splitTextOptions) {
        wordState.active = true;
        wordState.activeStyles = styles.splitTextOptions.activeWordStyles;
      } else if (i === nextWordIndex && styles.splitTextOptions) {
        wordState.next = true;
        wordState.nextStyles = styles.splitTextOptions.nextWordStyles;
      }

      if (this.debugMode && this._captionRenderCount <= 3 && i < 3) {
        console.log(`[DEBUG] Drawing word ${i}: "${word.text}" at (${wordX.toFixed(1)}, ${wordY.toFixed(1)}), opacity: ${word.transform.opacity}`);
      }

      this.drawWord(word.text, word.transform, styles, wordX, wordY, wordState);

      // Move to next word position
      currentX += metrics.width + styles.wordSpacing;
    }
  }

  /**
   * Get frame buffer from canvas using Skia's internal surface API
   * This is much faster than getImageData() as it reads directly from Skia's surface
   * @param {boolean} isEmpty - Whether this is an empty frame (no captions)
   * @returns {Buffer} RGBA frame buffer
   */
  getFrameBuffer(isEmpty = false) {
    // Fast path: return cached empty frame buffer
    if (isEmpty) {
      if (!this._emptyFrameBuffer) {
        // Create and cache empty frame buffer once
        this._emptyFrameBuffer = Buffer.alloc(this.width * this.height * 4);
        this._emptyFrameBuffer.fill(0); // All transparent
      }
      return this._emptyFrameBuffer;
    }

    try {
      // Try to use Skia's internal surface API for fastest pixel extraction
      // Check if _surface exists and is accessible
      if (this.canvas._surface && typeof this.canvas._surface.makeImageSnapshot === 'function') {
        try {
          const img = this.canvas._surface.makeImageSnapshot();
          
          // Reuse buffer if available, otherwise create new one
          if (!this._reusableBuffer || this._reusableBuffer.length !== this.width * this.height * 4) {
            this._reusableBuffer = Buffer.alloc(this.width * this.height * 4);
          }

          // Read pixels directly into buffer
          // Try straight alpha first (alphaType: 0), as Canvas 2D typically uses straight alpha
          // If that doesn't work, we'll fall back to premultiplied
          // colorType: 4 = RGBA_8888
          try {
            img.readPixels(
              0,
              0,
              this.width,
              this.height,
              {
                alphaType: 0,        // straight/unpremultiplied alpha
                colorType: 4,        // RGBA 8888
              },
              this._reusableBuffer,
              this.width * 4        // rowBytes (bytes per row)
            );

            // Verify we got valid pixel data (check a sample pixel)
            if (this.debugMode && this._frameCheckCount === undefined) {
              this._frameCheckCount = 0;
            }
            if (this.debugMode && this._frameCheckCount < 3) {
              this._frameCheckCount++;
              // Check center pixel and caption area for non-zero alpha
              const centerIdx = (Math.floor(this.width / 2) + Math.floor(this.height / 2) * this.width) * 4;
              const captionIdx = (Math.floor(this.width / 2) + Math.floor(this.height * 0.85) * this.width) * 4;
              if (centerIdx + 3 < this._reusableBuffer.length) {
                console.log(`[DEBUG] Frame ${this._frameCheckCount} - Center pixel: R=${this._reusableBuffer[centerIdx]}, G=${this._reusableBuffer[centerIdx+1]}, B=${this._reusableBuffer[centerIdx+2]}, A=${this._reusableBuffer[centerIdx+3]}`);
              }
              if (captionIdx + 3 < this._reusableBuffer.length) {
                console.log(`[DEBUG] Frame ${this._frameCheckCount} - Caption area pixel: R=${this._reusableBuffer[captionIdx]}, G=${this._reusableBuffer[captionIdx+1]}, B=${this._reusableBuffer[captionIdx+2]}, A=${this._reusableBuffer[captionIdx+3]}`);
              }
            }

            return this._reusableBuffer;
          } catch (readError) {
            // Fallback to premultiplied if straight alpha fails
            console.warn('[WARN] Straight alpha readPixels failed, trying premultiplied:', readError.message);
            img.readPixels(
              0,
              0,
              this.width,
              this.height,
              {
                alphaType: 1,        // premultiplied alpha
                colorType: 4,        // RGBA 8888
              },
              this._reusableBuffer,
              this.width * 4        // rowBytes (bytes per row)
            );
            return this._reusableBuffer;
          }
        } catch (surfaceError) {
          if (!this._hasLoggedSurfaceWarning) {
            console.error('[ERROR] Skia surface API failed:', surfaceError.message);
            console.error('[ERROR] Stack:', surfaceError.stack);
            this._hasLoggedSurfaceWarning = true;
          }
          // Fall through to getImageData fallback
        }
      } else {
        if (!this._hasLoggedSurfaceWarning) {
          console.warn('[WARN] Skia _surface API not available, using getImageData() fallback');
          this._hasLoggedSurfaceWarning = true;
        }
        // Fall through to getImageData fallback
      }
    } catch (error) {
      // Log errors even in non-debug mode for this critical function
      console.error('[ERROR] Failed to get frame buffer from Skia surface:', error);
      console.error('[ERROR] Error details:', error.message);
      if (error.stack) {
        console.error('[ERROR] Stack trace:', error.stack);
      }
    }
    
    // Fallback to getImageData if Skia surface API is not available or fails
    if (!this._hasLoggedFallback) {
      console.log('[INFO] Using getImageData() fallback for pixel extraction');
      this._hasLoggedFallback = true;
    }
    try {
      const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
      if (!imageData || !imageData.data) {
        console.error('[ERROR] getImageData returned null or invalid data');
        if (!this._emptyFrameBuffer) {
          this._emptyFrameBuffer = Buffer.alloc(this.width * this.height * 4);
          this._emptyFrameBuffer.fill(0);
        }
        return this._emptyFrameBuffer;
      }

      const data = imageData.data;
      if (!this._reusableBuffer || this._reusableBuffer.length !== data.length) {
        this._reusableBuffer = Buffer.alloc(data.length);
      }
      
      // Copy data efficiently using Buffer.from (creates a copy)
      const buffer = Buffer.from(data);
      
      // Verify we got valid pixel data (check a sample pixel)
      if (this.debugMode && this._frameCheckCount === undefined) {
        this._frameCheckCount = 0;
      }
      if (this.debugMode && this._frameCheckCount < 3) {
        this._frameCheckCount++;
        // Check center pixel and caption area for non-zero alpha
        const centerIdx = (Math.floor(this.width / 2) + Math.floor(this.height / 2) * this.width) * 4;
        const captionIdx = (Math.floor(this.width / 2) + Math.floor(this.height * 0.85) * this.width) * 4;
        if (centerIdx + 3 < buffer.length) {
          console.log(`[DEBUG] Frame ${this._frameCheckCount} (getImageData) - Center pixel: R=${buffer[centerIdx]}, G=${buffer[centerIdx+1]}, B=${buffer[centerIdx+2]}, A=${buffer[centerIdx+3]}`);
        }
        if (captionIdx + 3 < buffer.length) {
          console.log(`[DEBUG] Frame ${this._frameCheckCount} (getImageData) - Caption area pixel: R=${buffer[captionIdx]}, G=${buffer[captionIdx+1]}, B=${buffer[captionIdx+2]}, A=${buffer[captionIdx+3]}`);
        }
      }
      
      return buffer;
    } catch (fallbackError) {
      console.error('[ERROR] getImageData fallback also failed:', fallbackError.message);
      if (fallbackError.stack) {
        console.error('[ERROR] Fallback stack trace:', fallbackError.stack);
      }
      
      // Last resort: return empty buffer
      if (!this._emptyFrameBuffer) {
        this._emptyFrameBuffer = Buffer.alloc(this.width * this.height * 4);
        this._emptyFrameBuffer.fill(0);
      }
      return this._emptyFrameBuffer;
    }
  }

  /**
   * Draw a simple test pattern to verify rendering works
   */
  drawTestPattern() {
    if (this.debugMode) {
      console.log('[DEBUG] Drawing test pattern...');
      console.log(`[DEBUG] Canvas size: ${this.width}x${this.height}`);
    }

    // Fill entire canvas with semi-transparent red first
    this.ctx.fillStyle = 'rgba(255, 0, 0, 128)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw a solid red rectangle in the center
    this.ctx.fillStyle = 'rgba(255, 0, 0, 255)';
    this.ctx.fillRect(this.width / 2 - 100, this.height / 2 - 50, 200, 100);

    // Draw white text
    this.ctx.fillStyle = 'rgba(255, 255, 255, 255)';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('TEST', this.width / 2, this.height / 2);

    if (this.debugMode) {
      console.log('[DEBUG] Test pattern drawn');
    }
  }
}

