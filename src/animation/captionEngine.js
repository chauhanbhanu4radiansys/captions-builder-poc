/**
 * Caption animation orchestrator
 * Manages caption timing, word animations, and transform generation
 */

import { parseTranscript, getActiveSegments } from '../utils/parseTranscript.js';
import { Timeline } from './timeline.js';

/**
 * Caption Engine class
 * Orchestrates caption rendering and animation
 */
export class CaptionEngine {
  constructor(transcriptData, animationClasses) {
    this.segments = parseTranscript(transcriptData);
    this.animationClasses = animationClasses || {};
    this.timeline = new Timeline();
  }

  /**
   * Get active captions at a specific time
   * @param {number} time - Current time in seconds
   * @returns {Array<Object>} Array of active caption objects with transforms
   */
  getCaptionsAtTime(time) {
    const activeSegments = getActiveSegments(this.segments, time);
    
    return activeSegments.map(segment => {
      // Calculate container transform
      const containerIn = this.timeline.evaluateContainer(
        segment,
        'containerIn',
        time,
        this.animationClasses
      );
      
      const containerOut = this.timeline.evaluateContainer(
        segment,
        'containerOut',
        time,
        this.animationClasses
      );
      
      // Combine in/out animations (prefer out if both are active)
      let containerTransform = containerIn;
      if (time > segment.end - 0.3) { // If near end, use out animation
        const outProgress = (segment.end - time) / 0.3;
        containerTransform = {
          opacity: containerOut.opacity * outProgress + containerIn.opacity * (1 - outProgress),
          translateX: containerOut.translateX * outProgress + containerIn.translateX * (1 - outProgress),
          translateY: containerOut.translateY * outProgress + containerIn.translateY * (1 - outProgress),
          scale: containerOut.scale * outProgress + containerIn.scale * (1 - outProgress),
          rotation: containerOut.rotation * outProgress + containerIn.rotation * (1 - outProgress),
          blur: containerOut.blur * outProgress + containerIn.blur * (1 - outProgress)
        };
      }

      // Calculate word transforms
      const words = segment.words.map((word, index) => {
        const wordTransform = this.timeline.evaluateWord(
          word,
          time,
          segment.start,
          this.animationClasses,
          index
        );
        
        return {
          ...word,
          transform: wordTransform
        };
      });

      return {
        ...segment,
        containerTransform,
        words
      };
    });
  }

  /**
   * Get total duration of all captions
   * @returns {number} Total duration in seconds
   */
  getDuration() {
    if (this.segments.length === 0) return 0;
    return Math.max(...this.segments.map(s => s.end));
  }

  /**
   * Get all segments
   * @returns {Array<Object>} All caption segments
   */
  getSegments() {
    return this.segments;
  }
}

