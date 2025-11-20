/**
 * Main entry point for video caption renderer
 * Orchestrates the entire rendering pipeline
 */

import { existsSync } from 'fs';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { convertCSSToSkia } from './utils/cssToSkia.js';
import { CaptionEngine } from './animation/captionEngine.js';
import { SkiaRenderer } from './core/skiaRenderer.js';
import { FFmpegPipeline } from './core/ffmpegPipeline.js';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Get video metadata using fluent-ffmpeg
 * @param {string} videoPath - Path to video file
 * @returns {Promise<Object>} Video metadata {duration, fps, width, height}
 */
async function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    if (!existsSync(videoPath)) {
      reject(new Error(`Video file not found: ${videoPath}`));
      return;
    }

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found in file'));
        return;
      }

      const duration = metadata.format.duration || 0;
      // Parse FPS from "30/1" format
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        if (den && den > 0) {
          fps = num / den;
        }
      }
      const width = videoStream.width || 1920;
      const height = videoStream.height || 1080;

      resolve({ duration, fps, width, height });
    });
  });
}

/**
 * Main rendering function
 */
async function main() {
  try {
    logger.info('Starting video caption renderer...');

    // Validate configuration
    config.validate();

    // Load configuration files
    logger.info('Loading configuration files...');
    const transcriptData = config.loadTranscript();
    const cssConfig = config.loadCSS();

    // Check if video file exists
    if (!existsSync(config.videoPath)) {
      throw new Error(`Video file not found: ${config.videoPath}`);
    }

    // Get video metadata
    logger.info('Reading video metadata...');
    const videoMetadata = await getVideoMetadata(config.videoPath);
    logger.info(`Video: ${videoMetadata.width}x${videoMetadata.height} @ ${videoMetadata.fps} FPS, duration: ${videoMetadata.duration.toFixed(2)}s`);

    // Use video dimensions or config dimensions
    const width = config.width || videoMetadata.width;
    const height = config.height || videoMetadata.height;
    const fps = config.fps || Math.round(videoMetadata.fps);

    // Convert CSS to Skia styles
    logger.info('Converting CSS styles to Skia format...');
    const styles = convertCSSToSkia(cssConfig);

    // Initialize caption engine (use converted animation classes from styles)
    logger.info('Initializing caption engine...');
    const captionEngine = new CaptionEngine(transcriptData, styles.animationClasses);
    const transcriptDuration = captionEngine.getDuration();
    const totalDuration = Math.max(videoMetadata.duration, transcriptDuration);
    const totalFrames = Math.ceil(totalDuration * fps);

    logger.info(`Total frames to render: ${totalFrames} (${totalDuration.toFixed(2)}s @ ${fps} FPS)`);
    logger.info(`Found ${captionEngine.getSegments().length} caption segments`);
    
    // Log first few segments for debugging
    const segments = captionEngine.getSegments();
    if (segments.length > 0) {
      logger.info(`First segment: "${segments[0].text.substring(0, 50)}..." at ${segments[0].start}s - ${segments[0].end}s`);
    }

    // Initialize renderer
    logger.info('Initializing Skia renderer...');
    const renderer = new SkiaRenderer(width, height, config.debugMode);

    // Initialize FFmpeg pipeline
    logger.info('Initializing FFmpeg pipeline...');
    const ffmpegPipeline = new FFmpegPipeline(
      config.videoPath,
      config.outputPath,
      width,
      height,
      fps,
      config.ffmpegPreset,
      config.ffmpegCrf
    );

    await ffmpegPipeline.start();
    logger.info('FFmpeg pipeline started');

    // Render loop
    logger.info('Starting render loop...');
    logger.reset();

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / fps;

      // Get active captions at current time
      const activeCaptions = captionEngine.getCaptionsAtTime(time);
      const isEmpty = activeCaptions.length === 0;

      // Always log first few frames with captions to debug
      if (frame < 10 || (frame < 100 && frame % 30 === 0)) {
        if (activeCaptions.length > 0) {
          logger.info(`Frame ${frame} (${time.toFixed(2)}s): Found ${activeCaptions.length} active caption(s)`);
          if (activeCaptions[0].words && activeCaptions[0].words.length > 0) {
            logger.info(`  First caption has ${activeCaptions[0].words.length} words`);
            logger.info(`  First word: "${activeCaptions[0].words[0].text}" opacity: ${activeCaptions[0].words[0].transform?.opacity ?? 'N/A'}`);
            logger.info(`  Word timing: ${activeCaptions[0].words[0].start}s - ${activeCaptions[0].words[0].end}s`);
          }
        } else {
          logger.info(`Frame ${frame} (${time.toFixed(2)}s): No active captions`);
        }
      }

      // Only render if there are captions
      if (!isEmpty) {
        // Clear canvas only when we need to render
        renderer.clear();

        // Draw test pattern on first frame to verify rendering pipeline works
        if (frame === 0) {
          logger.info('[DEBUG] Drawing test pattern on first frame');
          renderer.drawTestPattern();
        }

        // Render each active caption
        for (const caption of activeCaptions) {
          renderer.renderCaption(caption, styles, time);
        }
      }

      // Get frame buffer - use cached empty buffer if no captions (avoids expensive getImageData call)
      const frameBuffer = renderer.getFrameBuffer(isEmpty);
      
      // Debug: Check pixel data for first few frames with captions
      if (!isEmpty && frame < 10) {
        // Sample a few pixels in the caption area to verify they have alpha
        const captionY = Math.floor(height * 0.85);
        const sampleX = Math.floor(width / 2);
        const sampleIdx = (captionY * width + sampleX) * 4;
        if (sampleIdx + 3 < frameBuffer.length) {
          const r = frameBuffer[sampleIdx];
          const g = frameBuffer[sampleIdx + 1];
          const b = frameBuffer[sampleIdx + 2];
          const a = frameBuffer[sampleIdx + 3];
          logger.info(`[DEBUG] Frame ${frame} caption area pixel (${sampleX}, ${captionY}): R=${r}, G=${g}, B=${b}, A=${a}`);
        }
      }
      
      await ffmpegPipeline.writeFrame(frameBuffer);

      // Log progress
      if ((frame + 1) % Math.max(1, Math.floor(fps)) === 0 || frame === totalFrames - 1) {
        logger.progress(frame + 1, totalFrames, fps);
      }
    }

    // Finalize
    logger.info('Finalizing encoding...');
    await ffmpegPipeline.close();

    // Log completion
    logger.complete(config.outputPath, totalFrames);
    logger.info('Done!');

  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run main function
main();

