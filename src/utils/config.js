/**
 * Configuration manager for the video caption renderer
 * Handles environment variables and default settings
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * Get configuration from environment variables or defaults
 */
export class Config {
  constructor() {
    this.projectRoot = projectRoot;
    this.transcriptPath = process.env.TRANSCRIPT_PATH || join(projectRoot, 'trx.json');
    this.videoPath = process.env.VIDEO_PATH || join(projectRoot, 'v1.mp4');
    this.cssPath = process.env.CSS_PATH || join(projectRoot, 'css.json');
    this.outputPath = process.env.OUTPUT_PATH || join(projectRoot, 'dist', 'output.mp4');
    this.fps = parseInt(process.env.FPS || '30', 10);
    this.width = parseInt(process.env.WIDTH || '1920', 10);
    this.height = parseInt(process.env.HEIGHT || '1080', 10);
    this.ffmpegPreset = process.env.FFMPEG_PRESET || 'veryfast';
    this.ffmpegCrf = parseInt(process.env.FFMPEG_CRF || '25', 10);
    this.skipEmptyFrames = process.env.SKIP_EMPTY_FRAMES !== 'false'; // Skip frames with no captions by default
    this.debugMode = process.env.DEBUG === 'true';
    this.renderFps = parseInt(process.env.RENDER_FPS || '0', 10); // 0 = use video FPS, otherwise render at lower FPS
  }

  /**
   * Load transcript file
   * @returns {Object} Parsed transcript data
   */
  loadTranscript() {
    try {
      const content = readFileSync(this.transcriptPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load transcript from ${this.transcriptPath}: ${error.message}`);
    }
  }

  /**
   * Load CSS configuration file
   * @returns {Object} Parsed CSS configuration
   */
  loadCSS() {
    try {
      const content = readFileSync(this.cssPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load CSS config from ${this.cssPath}: ${error.message}`);
    }
  }

  /**
   * Validate configuration
   * @throws {Error} If configuration is invalid
   */
  validate() {
    if (this.fps <= 0 || this.fps > 120) {
      throw new Error(`Invalid FPS: ${this.fps}. Must be between 1 and 120.`);
    }
    if (this.width <= 0 || this.height <= 0) {
      throw new Error(`Invalid dimensions: ${this.width}x${this.height}`);
    }
    if (this.ffmpegCrf < 0 || this.ffmpegCrf > 51) {
      throw new Error(`Invalid CRF: ${this.ffmpegCrf}. Must be between 0 and 51.`);
    }
  }
}

// Export singleton instance
export const config = new Config();

