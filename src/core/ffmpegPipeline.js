/**
 * FFmpeg streaming pipeline
 * Streams raw RGBA frames to FFmpeg via stdin
 */

import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

/**
 * FFmpeg Pipeline class
 * Manages FFmpeg process and frame streaming
 */
export class FFmpegPipeline {
  /**
   * Create a new FFmpeg pipeline
   * @param {string} videoPath - Path to input video
   * @param {string} outputPath - Path to output video
   * @param {number} width - Frame width
   * @param {number} height - Frame height
   * @param {number} fps - Frame rate
   * @param {string} preset - FFmpeg preset
   * @param {number} crf - Constant Rate Factor
   */
  constructor(videoPath, outputPath, width, height, fps, preset = 'medium', crf = 18) {
    this.videoPath = videoPath;
    this.outputPath = outputPath;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.preset = preset;
    this.crf = crf;
    this.process = null;
    this.frameCount = 0;
    this.errorBuffer = '';
    this.pendingWrites = 0;
    this.maxPendingWrites = 10; // Limit pending writes to prevent memory buildup
  }

  /**
   * Start the FFmpeg process
   * @returns {Promise<void>} Promise that resolves when FFmpeg starts
   */
  async start() {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      const outputDir = dirname(this.outputPath);
      try {
        mkdirSync(outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore
      }

      // Build FFmpeg command
      const args = [
        '-y', // Overwrite output file
        '-f', 'rawvideo',
        '-pixel_format', 'rgba',
        '-video_size', `${this.width}x${this.height}`,
        '-framerate', this.fps.toString(),
        '-i', 'pipe:0', // Read from stdin
        '-i', this.videoPath, // Input video
        '-filter_complex', '[0:v][1:v]overlay=0:0[out]', // Overlay captions on video (straight alpha)
        '-map', '[out]',
        '-map', '1:a?', // Map audio if available
        '-c:v', 'libx264',
        '-preset', this.preset,
        '-crf', this.crf.toString(),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy', // Copy audio codec
        this.outputPath
      ];

      logger.info(`Starting FFmpeg: ffmpeg ${args.join(' ')}`);

      // Spawn FFmpeg process
      this.process = spawn('ffmpeg', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle stdout (usually empty for FFmpeg)
      this.process.stdout.on('data', (data) => {
        // FFmpeg progress info might come through stderr, not stdout
      });

      // Handle stderr (FFmpeg writes progress to stderr)
      this.process.stderr.on('data', (data) => {
        this.errorBuffer += data.toString();
        // Parse progress if needed
        const lines = this.errorBuffer.split('\n');
        this.errorBuffer = lines.pop() || ''; // Keep last incomplete line
        
        for (const line of lines) {
          if (line.includes('frame=')) {
            // Extract frame number if needed for progress
            const match = line.match(/frame=\s*(\d+)/);
            if (match) {
              // Could use this for more detailed progress
            }
          }
        }
      });

      // Handle process errors
      this.process.on('error', (error) => {
        logger.error('FFmpeg process error:', error);
        reject(error);
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          logger.error(`FFmpeg exited with code ${code}, signal ${signal}`);
          logger.error(`FFmpeg stderr: ${this.errorBuffer}`);
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      // Wait a bit for process to initialize
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          resolve();
        } else {
          reject(new Error('FFmpeg process failed to start'));
        }
      }, 100);
    });
  }

  /**
   * Write a frame to FFmpeg
   * @param {Buffer} frameBuffer - RGBA frame buffer
   * @returns {Promise<void>} Promise that resolves when frame is written
   */
  async writeFrame(frameBuffer) {
    return new Promise((resolve, reject) => {
      if (!this.process || this.process.killed) {
        reject(new Error('FFmpeg process is not running'));
        return;
      }

      const expectedSize = this.width * this.height * 4;
      if (frameBuffer.length !== expectedSize) {
        reject(new Error(`Frame buffer size mismatch: expected ${expectedSize}, got ${frameBuffer.length}`));
        return;
      }

      // Wait if too many writes are pending (backpressure handling)
      const tryWrite = () => {
        if (this.pendingWrites >= this.maxPendingWrites) {
          // Wait a bit for FFmpeg to catch up
          setTimeout(tryWrite, 1);
          return;
        }

        this.pendingWrites++;
        
        // Try to write the frame
        // Note: write() callback only fires on error, not on success
        const writeable = this.process.stdin.write(frameBuffer, (error) => {
          this.pendingWrites--;
          if (error) {
            reject(error);
          }
          // On success, callback doesn't fire, so we handle it below
        });

        // Handle backpressure - if write returns false, wait for drain
        if (!writeable) {
          this.process.stdin.once('drain', () => {
            this.pendingWrites--;
            this.frameCount++;
            resolve();
          });
        } else {
          // Write succeeded immediately - data is in kernel buffer
          this.pendingWrites--;
          this.frameCount++;
          resolve();
        }
      };

      tryWrite();
    });
  }

  /**
   * Close the FFmpeg pipeline
   * @returns {Promise<void>} Promise that resolves when encoding is complete
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        resolve();
        return;
      }

      // Close stdin to signal end of input
      this.process.stdin.end();

      // Wait for process to complete
      this.process.on('exit', (code) => {
        if (code === 0) {
          logger.info(`FFmpeg encoding complete. Wrote ${this.frameCount} frames.`);
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          logger.warn('FFmpeg encoding timeout, killing process');
          this.process.kill();
          reject(new Error('FFmpeg encoding timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Get current frame count
   * @returns {number} Number of frames written
   */
  getFrameCount() {
    return this.frameCount;
  }
}

