/**
 * Logging utility for the video caption renderer
 * Provides structured logging with progress tracking and performance metrics
 */

/**
 * Logger class for structured logging
 */
export class Logger {
  constructor() {
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastProgressTime = Date.now();
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} [context] - Additional context data
   */
  info(message, context = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, Object.keys(context).length > 0 ? context : '');
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error} [error] - Error object
   */
  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`);
    if (error) {
      console.error(error.stack || error);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   */
  warn(message) {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`);
  }

  /**
   * Log progress information
   * @param {number} current - Current frame number
   * @param {number} total - Total frames
   * @param {number} fps - Current rendering FPS
   */
  progress(current, total, fps) {
    this.frameCount = current;
    const percent = ((current / total) * 100).toFixed(1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgFps = current / elapsed;
    
    // Update every second or every 10%
    const now = Date.now();
    if (now - this.lastProgressTime > 1000 || current % Math.max(1, Math.floor(total / 10)) === 0) {
      process.stdout.write(`\rRendering: ${percent}% (${current}/${total} frames) - ${avgFps.toFixed(1)} FPS`);
      this.lastProgressTime = now;
    }
  }

  /**
   * Log completion message
   * @param {string} outputPath - Path to output file
   * @param {number} totalFrames - Total frames rendered
   */
  complete(outputPath, totalFrames) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgFps = totalFrames / elapsed;
    console.log(`\n[SUCCESS] Rendering complete!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Frames: ${totalFrames}`);
    console.log(`  Time: ${elapsed.toFixed(2)}s`);
    console.log(`  Average FPS: ${avgFps.toFixed(2)}`);
  }

  /**
   * Reset the logger state
   */
  reset() {
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastProgressTime = Date.now();
  }
}

// Export singleton instance
export const logger = new Logger();

