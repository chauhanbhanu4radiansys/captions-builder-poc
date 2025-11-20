/**
 * Frame buffer management
 * Handles RGBA frame buffer allocation and management
 */

/**
 * FrameBuffer class for managing RGBA pixel data
 */
export class FrameBuffer {
  /**
   * Create a new frame buffer
   * @param {number} width - Frame width in pixels
   * @param {number} height - Frame height in pixels
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height * 4; // RGBA = 4 bytes per pixel
    this.buffer = Buffer.allocUnsafe(this.size);
  }

  /**
   * Clear the buffer (set all pixels to transparent)
   */
  clear() {
    this.buffer.fill(0);
  }

  /**
   * Get the raw buffer
   * @returns {Buffer} Raw RGBA buffer
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   * Get buffer size in bytes
   * @returns {number} Buffer size
   */
  getSize() {
    return this.size;
  }

  /**
   * Copy pixel data from another buffer
   * @param {Buffer|Uint8Array} source - Source buffer
   * @param {number} [offset=0] - Offset in source buffer
   */
  copyFrom(source, offset = 0) {
    source.copy(this.buffer, 0, offset, Math.min(this.size, source.length - offset));
  }

  /**
   * Set a pixel value
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @param {number} a - Alpha value (0-255)
   */
  setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return; // Out of bounds
    }
    
    const index = (y * this.width + x) * 4;
    this.buffer[index] = r;
    this.buffer[index + 1] = g;
    this.buffer[index + 2] = b;
    this.buffer[index + 3] = a;
  }
}

