/**
 * CSS-to-Skia style converter
 * Converts CSS-style configuration to Skia Canvas API calls
 */

/**
 * Parse CSS color string to RGBA array
 * @param {string} color - CSS color string (hex, rgb, rgba, or named color)
 * @returns {Object} Object with r, g, b, a values (0-255)
 */
export function parseColor(color) {
  if (!color) return { r: 255, g: 255, b: 255, a: 255 };

  // Remove whitespace
  color = color.trim();

  // Hex color (#RRGGBB or #RRGGBBAA)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 255
      };
    } else if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16)
      };
    }
  }

  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const values = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
    return {
      r: Math.round(values[0] || 0),
      g: Math.round(values[1] || 0),
      b: Math.round(values[2] || 0),
      a: Math.round((values[3] !== undefined ? values[3] : 1) * 255)
    };
  }

  // Named colors (basic set)
  const namedColors = {
    white: { r: 255, g: 255, b: 255, a: 255 },
    black: { r: 0, g: 0, b: 0, a: 255 },
    red: { r: 255, g: 0, b: 0, a: 255 },
    green: { r: 0, g: 128, b: 0, a: 255 },
    blue: { r: 0, g: 0, b: 255, a: 255 },
    transparent: { r: 0, g: 0, b: 0, a: 0 }
  };

  if (namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()];
  }

  // Default to white
  return { r: 255, g: 255, b: 255, a: 255 };
}

/**
 * Parse CSS size value (px, em, etc.) to pixels
 * @param {string} size - CSS size string
 * @param {number} baseSize - Base size for relative units (default: 16)
 * @returns {number} Size in pixels
 */
export function parseSize(size, baseSize = 16) {
  if (!size) return 0;
  const match = size.match(/^([\d.]+)(px|em|rem)?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2] || 'px';
    if (unit === 'px') return value;
    if (unit === 'em' || unit === 'rem') return value * baseSize;
  }
  return parseFloat(size) || 0;
}

/**
 * Parse padding string to object
 * @param {string} padding - CSS padding string (e.g., "20px 32px" or "20px")
 * @returns {Object} Object with top, right, bottom, left values
 */
export function parsePadding(padding) {
  if (!padding) return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const values = padding.split(/\s+/).map(v => parseSize(v));
  
  if (values.length === 1) {
    return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
  } else if (values.length === 2) {
    return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
  } else if (values.length === 4) {
    return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
  }
  
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

/**
 * Parse text shadow string
 * @param {string} shadow - CSS text-shadow string
 * @returns {Object} Shadow configuration
 */
export function parseTextShadow(shadow) {
  if (!shadow || shadow === 'none') {
    return null;
  }

  // Parse "offsetX offsetY blurRadius color"
  const match = shadow.match(/([\d.-]+)px\s+([\d.-]+)px\s+([\d.-]+)px\s+(.+)/);
  if (match) {
    return {
      offsetX: parseFloat(match[1]),
      offsetY: parseFloat(match[2]),
      blur: parseFloat(match[3]),
      color: parseColor(match[4])
    };
  }

  return null;
}

/**
 * Parse backdrop filter blur
 * @param {string} filter - CSS backdrop-filter string (e.g., "blur(12px)" or "blur(0.75em)")
 * @returns {number|null} Blur radius in pixels or null
 */
export function parseBackdropFilter(filter) {
  if (!filter) return null;
  // Match "blur(Xpx)" or "blur(Xem)"
  const match = filter.match(/blur\(([\d.]+)(px|em|rem)\)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'px') return value;
    if (unit === 'em' || unit === 'rem') return value * 16; // Convert em to px
  }
  return null;
}

/**
 * Parse border string
 * @param {string} border - CSS border string (e.g., "1px solid rgba(255, 255, 255, 0.1)")
 * @returns {Object|null} Border configuration or null
 */
export function parseBorder(border) {
  if (!border || border === 'none') return null;
  
  const match = border.match(/([\d.]+)(px|em|rem)?\s+(solid|dashed|dotted)?\s+(.+)/);
  if (match) {
    const width = parseSize(match[1] + (match[2] || 'px'));
    const style = match[3] || 'solid';
    const color = parseColor(match[4].trim());
    
    return { width, style, color };
  }
  
  return null;
}

/**
 * Parse Tailwind-style gradient colors
 * @param {Array<string>} colorClasses - Array of Tailwind color classes
 * @returns {Object|null} Gradient configuration or null
 */
export function parseGradientColors(colorClasses) {
  if (!colorClasses || colorClasses.length === 0) return null;
  
  // Find gradient direction
  let angle = 135; // Default diagonal
  const directionClass = colorClasses.find(c => c.startsWith('bg-gradient-'));
  if (directionClass) {
    if (directionClass.includes('to-br')) angle = 135;
    else if (directionClass.includes('to-bl')) angle = 225;
    else if (directionClass.includes('to-tr')) angle = 45;
    else if (directionClass.includes('to-tl')) angle = 315;
    else if (directionClass.includes('to-r')) angle = 90;
    else if (directionClass.includes('to-l')) angle = 270;
    else if (directionClass.includes('to-b')) angle = 180;
    else if (directionClass.includes('to-t')) angle = 0;
  }
  
  // Extract color values from Tailwind classes
  const colors = [];
  const colorMap = {
    // Purple shades
    'purple-50': '#faf5ff', 'purple-100': '#f3e8ff', 'purple-200': '#e9d5ff',
    'purple-300': '#d8b4fe', 'purple-400': '#c084fc', 'purple-500': '#a855f7',
    'purple-600': '#9333ea', 'purple-700': '#7e22ce', 'purple-800': '#6b21a8',
    'purple-900': '#581c87',
    // Pink shades
    'pink-50': '#fdf2f8', 'pink-100': '#fce7f3', 'pink-200': '#fbcfe8',
    'pink-300': '#f9a8d4', 'pink-400': '#f472b6', 'pink-500': '#ec4899',
    'pink-600': '#db2777', 'pink-700': '#be185d', 'pink-800': '#9f1239',
    'pink-900': '#831843',
    // Red shades
    'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca',
    'red-300': '#fca5a5', 'red-400': '#f87171', 'red-500': '#ef4444',
    'red-600': '#dc2626', 'red-700': '#b91c1c', 'red-800': '#991b1b',
    'red-900': '#7f1d1d',
    // Blue shades
    'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe',
    'blue-300': '#93c5fd', 'blue-400': '#60a5fa', 'blue-500': '#3b82f6',
    'blue-600': '#2563eb', 'blue-700': '#1d4ed8', 'blue-800': '#1e40af',
    'blue-900': '#1e3a8a',
    // Add more as needed
  };
  
  for (const cls of colorClasses) {
    if (cls.startsWith('from-')) {
      const colorName = cls.replace('from-', '');
      colors.push(colorMap[colorName] || '#000000');
    } else if (cls.startsWith('via-')) {
      const colorName = cls.replace('via-', '');
      colors.push(colorMap[colorName] || '#000000');
    } else if (cls.startsWith('to-')) {
      const colorName = cls.replace('to-', '');
      colors.push(colorMap[colorName] || '#000000');
    }
  }
  
  // If no colors found, try to parse hex/rgb from classes
  if (colors.length === 0) {
    for (const cls of colorClasses) {
      if (cls.startsWith('#')) {
        colors.push(cls);
      } else if (cls.match(/^rgba?\(/)) {
        colors.push(cls);
      }
    }
  }
  
  if (colors.length === 0) return null;
  
  return {
    type: 'linear',
    angle,
    colors
  };
}

/**
 * Create default animations for string-based animation class references
 * @param {Object} animationClasses - Animation class object (may contain strings)
 * @returns {Object} Full animation definitions
 */
function createDefaultAnimations(animationClasses) {
  const defaults = {
    containerIn: {
      duration: 0.3,
      keyframes: [
        { time: 0, opacity: 0, translateY: 30, scale: 0.9 },
        { time: 1, opacity: 1, translateY: 0, scale: 1 }
      ],
      easing: 'ease-out'
    },
    containerOut: {
      duration: 0.3,
      keyframes: [
        { time: 0, opacity: 1, translateY: 0, scale: 1 },
        { time: 1, opacity: 0, translateY: -30, scale: 0.9 }
      ],
      easing: 'ease-in'
    },
    wordIn: {
      duration: 0.2,
      stagger: 0.05,
      keyframes: [
        { time: 0, opacity: 0, translateY: 20, scale: 0.8 },
        { time: 1, opacity: 1, translateY: 0, scale: 1 }
      ],
      easing: 'ease-out'
    }
  };
  
  const result = {};
  for (const [key, value] of Object.entries(animationClasses || {})) {
    // If it's a string reference, use default
    if (typeof value === 'string') {
      result[key] = defaults[key] || defaults.wordIn;
    } else {
      // If it's already an object, use it
      result[key] = value;
    }
  }
  
  // Ensure defaults exist
  return { ...defaults, ...result };
}

/**
 * Convert CSS configuration to Skia-compatible style object
 * @param {Object} cssConfig - CSS configuration object (may have 'data' key)
 * @returns {Object} Skia-compatible style object
 */
export function convertCSSToSkia(cssConfig) {
  // Extract from 'data' key if present
  const data = cssConfig.data || cssConfig;
  const cueStyles = data.cueStyles || {};
  
  // Parse gradient from colors array
  let gradient = data.gradient || null;
  if (!gradient && data.colors && Array.isArray(data.colors)) {
    gradient = parseGradientColors(data.colors);
  }
  
  // Handle null fontSize - use default or calculate from video dimensions
  const fontSize = cueStyles.fontSize === null ? null : parseSize(cueStyles.fontSize || '48px');
  
  // Create animation classes (handle string references)
  const animationClasses = createDefaultAnimations(data.animationClasses);
  
  return {
    fontSize,
    fontWeight: cueStyles.fontWeight || '700',
    fontFamily: cueStyles.fontFamily || 'Arial',
    color: parseColor(cueStyles.color || '#FFFFFF'),
    backgroundColor: parseColor(cueStyles.backgroundColor || 'rgba(0, 0, 0, 0.7)'),
    backdropBlur: parseBackdropFilter(cueStyles.backdropFilter),
    borderRadius: parseSize(cueStyles.borderRadius || '16px'),
    padding: parsePadding(cueStyles.padding || '20px 32px'),
    wordSpacing: parseSize(cueStyles.wordSpacing || '8px'),
    textShadow: parseTextShadow(cueStyles.textShadow),
    border: parseBorder(cueStyles.border),
    textAlign: cueStyles.textAlign || 'center',
    lineHeight: parseFloat(cueStyles.lineHeight) || 1.4,
    gradient,
    animationClasses,
    splitTextOptions: data.splitTextOptions || null
  };
}

/**
 * Create gradient object for Skia
 * @param {Object} gradientConfig - Gradient configuration
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Gradient configuration for Skia
 */
export function createGradient(gradientConfig, width, height) {
  if (!gradientConfig) return null;

  const { type, angle, colors } = gradientConfig;
  
  if (type === 'linear') {
    // Convert angle (degrees) to start/end points
    const rad = (angle * Math.PI) / 180;
    const centerX = width / 2;
    const centerY = height / 2;
    const length = Math.sqrt(width * width + height * height);
    
    const startX = centerX - (length / 2) * Math.cos(rad);
    const startY = centerY - (length / 2) * Math.sin(rad);
    const endX = centerX + (length / 2) * Math.cos(rad);
    const endY = centerY + (length / 2) * Math.sin(rad);

    return {
      type: 'linear',
      startX,
      startY,
      endX,
      endY,
      colors: colors.map(c => parseColor(c))
    };
  } else if (type === 'radial') {
    return {
      type: 'radial',
      centerX: width / 2,
      centerY: height / 2,
      radius: Math.min(width, height) / 2,
      colors: colors.map(c => parseColor(c))
    };
  }

  return null;
}

