/**
 * Easing functions library
 * Provides smooth animation curves for caption animations
 */

/**
 * Linear easing (no easing)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value
 */
export function linear(t) {
  return t;
}

/**
 * Ease in (slow start)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value
 */
export function easeIn(t) {
  return t * t;
}

/**
 * Ease out (slow end)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value
 */
export function easeOut(t) {
  return t * (2 - t);
}

/**
 * Ease in-out (slow start and end)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value
 */
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Cubic bezier easing
 * @param {number} x1 - First control point x
 * @param {number} y1 - First control point y
 * @param {number} x2 - Second control point x
 * @param {number} y2 - Second control point y
 * @returns {Function} Easing function
 */
export function cubicBezier(x1, y1, x2, y2) {
  return function(t) {
    // Simplified cubic bezier approximation
    // For production, use a more accurate implementation
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    
    // Find t for given x using Newton-Raphson
    let currentT = t;
    for (let i = 0; i < 8; i++) {
      const currentX = ((ax * currentT + bx) * currentT + cx) * currentT;
      const dx = ((3 * ax * currentT + 2 * bx) * currentT + cx);
      if (Math.abs(dx) < 0.0001) break;
      currentT -= (currentX - t) / dx;
    }
    
    const y = ((ay * currentT + by) * currentT + cy) * currentT;
    return y;
  };
}

/**
 * Back easing (overshoots slightly)
 * @param {number} t - Time value between 0 and 1
 * @param {number} [s=1.70158] - Overshoot amount
 * @returns {number} Eased value
 */
export function back(t, s = 1.70158) {
  return t * t * ((s + 1) * t - s);
}

/**
 * Bounce easing
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value
 */
export function bounce(t) {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  } else {
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
}

/**
 * Elastic easing
 * @param {number} t - Time value between 0 and 1
 * @param {number} [amplitude=1] - Amplitude
 * @param {number} [period=0.3] - Period
 * @returns {number} Eased value
 */
export function elastic(t, amplitude = 1, period = 0.3) {
  if (t === 0 || t === 1) return t;
  
  const s = period / 4;
  return -amplitude * Math.pow(2, 10 * (t - 1)) * 
         Math.sin((t - 1 - s) * (2 * Math.PI) / period);
}

/**
 * Get easing function by name
 * @param {string} name - Easing function name
 * @param {Array} [params] - Optional parameters for the easing function
 * @returns {Function} Easing function
 */
export function getEasing(name, params = []) {
  const easingMap = {
    'linear': linear,
    'ease-in': easeIn,
    'easeIn': easeIn,
    'ease-out': easeOut,
    'easeOut': easeOut,
    'ease-in-out': easeInOut,
    'easeInOut': easeInOut,
    'back': back,
    'bounce': bounce,
    'elastic': elastic
  };

  if (name.startsWith('cubic-bezier') || name.startsWith('cubicBezier')) {
    // Parse cubic-bezier parameters
    const match = name.match(/cubic[-_]?bezier\(([^)]+)\)/);
    if (match) {
      const coords = match[1].split(',').map(v => parseFloat(v.trim()));
      if (coords.length === 4) {
        return cubicBezier(coords[0], coords[1], coords[2], coords[3]);
      }
    }
    // Or use params array
    if (params.length === 4) {
      return cubicBezier(params[0], params[1], params[2], params[3]);
    }
  }

  const easing = easingMap[name.toLowerCase()];
  if (!easing) {
    console.warn(`Unknown easing function: ${name}, using linear`);
    return linear;
  }

  // Apply parameters if needed
  if (name === 'back' && params.length > 0) {
    return (t) => back(t, params[0]);
  }
  if (name === 'elastic' && params.length >= 2) {
    return (t) => elastic(t, params[0], params[1]);
  }

  return easing;
}

