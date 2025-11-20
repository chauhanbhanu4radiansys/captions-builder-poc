/**
 * Timeline and keyframe system
 * Manages animation timelines, keyframe interpolation, and stagger effects
 */

import { getEasing } from './easing.js';

/**
 * Timeline class for managing animations
 */
export class Timeline {
  constructor() {
    this.animations = new Map();
  }

  /**
   * Interpolate between two keyframes
   * @param {Object} keyframe1 - First keyframe
   * @param {Object} keyframe2 - Second keyframe
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Object} Interpolated values
   */
  interpolateKeyframes(keyframe1, keyframe2, t) {
    const result = {};
    const keys = new Set([...Object.keys(keyframe1), ...Object.keys(keyframe2)]);
    
    for (const key of keys) {
      if (key === 'time') continue;
      
      const v1 = keyframe1[key] !== undefined ? keyframe1[key] : keyframe2[key];
      const v2 = keyframe2[key] !== undefined ? keyframe2[key] : keyframe1[key];
      
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        result[key] = v1 + (v2 - v1) * t;
      } else {
        // Use the value from the closest keyframe
        result[key] = t < 0.5 ? v1 : v2;
      }
    }
    
    return result;
  }

  /**
   * Evaluate animation at a specific time
   * @param {Object} animation - Animation configuration with keyframes and easing
   * @param {number} time - Current time relative to animation start (0-1)
   * @returns {Object} Interpolated transform values
   */
  evaluateAnimation(animation, time) {
    const { keyframes, easing } = animation;
    
    if (!keyframes || keyframes.length === 0) {
      return {};
    }

    // Clamp time to [0, 1]
    time = Math.max(0, Math.min(1, time));

    // Find the two keyframes to interpolate between
    let keyframe1 = keyframes[0];
    let keyframe2 = keyframes[keyframes.length - 1];
    let keyframeTime1 = 0;
    let keyframeTime2 = 1;

    for (let i = 0; i < keyframes.length - 1; i++) {
      const kf1 = keyframes[i];
      const kf2 = keyframes[i + 1];
      const t1 = kf1.time || (i / (keyframes.length - 1));
      const t2 = kf2.time || ((i + 1) / (keyframes.length - 1));

      if (time >= t1 && time <= t2) {
        keyframe1 = kf1;
        keyframe2 = kf2;
        keyframeTime1 = t1;
        keyframeTime2 = t2;
        break;
      }
    }

    // Normalize time between the two keyframes
    const range = keyframeTime2 - keyframeTime1;
    const normalizedTime = range > 0 ? (time - keyframeTime1) / range : 0;

    // Apply easing
    const easingFunc = getEasing(easing || 'linear');
    const easedTime = easingFunc(normalizedTime);

    // Interpolate
    return this.interpolateKeyframes(keyframe1, keyframe2, easedTime);
  }

  /**
   * Evaluate container animation
   * @param {Object} caption - Caption segment
   * @param {string} animationType - Type of animation ('containerIn', 'containerOut', etc.)
   * @param {number} currentTime - Current time in seconds
   * @param {Object} animationClasses - Animation class definitions
   * @returns {Object} Transform values
   */
  evaluateContainer(caption, animationType, currentTime, animationClasses) {
    const animation = animationClasses[animationType];
    if (!animation) {
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotation: 0 };
    }

    const captionStart = caption.start;
    const captionEnd = caption.end;
    const captionDuration = captionEnd - captionStart;

    // Calculate relative time within caption
    let relativeTime = 0;
    
    if (animationType.includes('In')) {
      // For "in" animations, use start of caption as reference
      const animationDuration = animation.duration || 0.3;
      const elapsed = currentTime - captionStart;
      relativeTime = Math.min(1, elapsed / animationDuration);
    } else if (animationType.includes('Out')) {
      // For "out" animations, use end of caption as reference
      const animationDuration = animation.duration || 0.3;
      const elapsed = captionEnd - currentTime;
      relativeTime = Math.min(1, elapsed / animationDuration);
    } else {
      // Default: use entire caption duration
      relativeTime = (currentTime - captionStart) / captionDuration;
    }

    const transform = this.evaluateAnimation(animation, relativeTime);
    
    // Return with defaults
    return {
      opacity: transform.opacity !== undefined ? transform.opacity : 1,
      translateX: transform.translateX || 0,
      translateY: transform.translateY || 0,
      scale: transform.scale !== undefined ? transform.scale : 1,
      rotation: transform.rotation || 0,
      blur: transform.blur || 0
    };
  }

  /**
   * Evaluate word animation with stagger
   * @param {Object} word - Word object with timing
   * @param {number} currentTime - Current time in seconds
   * @param {number} captionStart - Caption start time
   * @param {Object} animationClasses - Animation class definitions
   * @param {number} wordIndex - Index of word in caption
   * @returns {Object} Transform values
   */
  evaluateWord(word, currentTime, captionStart, animationClasses, wordIndex = 0) {
    const wordAnimation = animationClasses.wordIn;
    
    // If word is in its time range, ensure it's visible
    const wordStart = word.start;
    const wordEnd = word.end;
    const isWordActive = currentTime >= wordStart && currentTime <= wordEnd;
    
    if (!wordAnimation) {
      // No animation - just show if in time range
      return { 
        opacity: isWordActive ? 1 : 0, 
        translateX: 0, 
        translateY: 0, 
        scale: 1, 
        rotation: 0 
      };
    }

    const stagger = wordAnimation.stagger || 0;
    const wordDuration = wordEnd - wordStart;

    // Calculate relative time within word animation
    let relativeTime = 0;
    
    // Apply stagger delay
    const staggerDelay = wordIndex * stagger;
    const adjustedWordStart = wordStart + staggerDelay;
    
    if (currentTime < adjustedWordStart) {
      // Before word starts - but if we're in the word's time range, show it
      if (isWordActive) {
        relativeTime = 0.5; // Show at mid-animation to ensure visibility
      } else {
        relativeTime = 0;
      }
    } else if (currentTime >= wordEnd) {
      // After word ends
      relativeTime = 1;
    } else {
      // During word animation
      const elapsed = currentTime - adjustedWordStart;
      const animationDuration = wordAnimation.duration || wordDuration;
      relativeTime = Math.min(1, Math.max(0, elapsed / animationDuration));
    }

    const transform = this.evaluateAnimation(wordAnimation, relativeTime);
    
    // Ensure opacity is at least 0.5 if word is active (to ensure visibility)
    let opacity = transform.opacity !== undefined ? transform.opacity : 1;
    if (isWordActive && opacity < 0.5) {
      opacity = 0.5; // Minimum visibility for active words
    }
    
    return {
      opacity: opacity,
      translateX: transform.translateX || 0,
      translateY: transform.translateY || 0,
      scale: transform.scale !== undefined ? transform.scale : 1,
      rotation: transform.rotation || 0,
      blur: transform.blur || 0
    };
  }
}

