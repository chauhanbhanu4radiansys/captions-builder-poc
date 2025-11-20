/**
 * Transcript parser utility
 * Parses transcript JSON files and extracts caption segments with word timings
 */

/**
 * Parse transcript data into normalized format
 * @param {Object} transcriptData - Raw transcript JSON data
 * @returns {Array<Object>} Array of caption segments with words
 */
export function parseTranscript(transcriptData) {
  // Handle different transcript formats
  let segments = [];
  
  // Check if it's the nested format (transcription_data.segments)
  if (transcriptData.transcription_data && transcriptData.transcription_data.segments) {
    segments = transcriptData.transcription_data.segments;
  }
  // Check if it's a direct array format
  else if (Array.isArray(transcriptData)) {
    segments = transcriptData;
  }
  // Check if it has a segments property
  else if (transcriptData.segments && Array.isArray(transcriptData.segments)) {
    segments = transcriptData.segments;
  }
  else {
    throw new Error('Invalid transcript format: expected segments array or transcription_data.segments');
  }

  // Normalize segments
  const normalizedSegments = segments.map((segment, index) => {
    // Extract text, start, end
    const text = segment.text || '';
    let start = parseFloat(segment.start);
    let end = parseFloat(segment.end);

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid timing in segment ${index}: start=${segment.start}, end=${segment.end}`);
    }

    if (end < start) {
      throw new Error(`Invalid timing in segment ${index}: end (${end}) must be greater than or equal to start (${start})`);
    }
    
    // Handle zero-duration segments by adding a small duration
    if (end === start) {
      end = start + 0.01; // Add 10ms to avoid zero-duration issues
    }

    // Normalize words array
    let words = [];
    if (segment.words && Array.isArray(segment.words)) {
      words = segment.words.map((word, wordIndex) => {
        let wordStart = parseFloat(word.start);
        let wordEnd = parseFloat(word.end);
        const wordText = word.text || '';

        if (isNaN(wordStart) || isNaN(wordEnd)) {
          throw new Error(`Invalid word timing in segment ${index}, word ${wordIndex}`);
        }

        // Handle zero-duration words
        if (wordEnd < wordStart) {
          throw new Error(`Invalid word timing in segment ${index}, word ${wordIndex}: end (${wordEnd}) must be >= start (${wordStart})`);
        }
        if (wordEnd === wordStart) {
          wordEnd = wordStart + 0.01; // Add 10ms to avoid zero-duration issues
        }

        return {
          text: wordText,
          start: wordStart,
          end: wordEnd,
          index: wordIndex
        };
      });
    } else {
      // If no words array, create a single word from the segment text
      words = [{
        text: text,
        start: start,
        end: end,
        index: 0
      }];
    }

    return {
      text,
      start,
      end,
      words,
      index
    };
  });

  // Sort by start time
  normalizedSegments.sort((a, b) => a.start - b.start);

  return normalizedSegments;
}

/**
 * Get total duration of transcript
 * @param {Array<Object>} segments - Parsed segments
 * @returns {number} Total duration in seconds
 */
export function getTranscriptDuration(segments) {
  if (!segments || segments.length === 0) {
    return 0;
  }
  return Math.max(...segments.map(s => s.end));
}

/**
 * Get active segments at a specific time
 * @param {Array<Object>} segments - Parsed segments
 * @param {number} time - Current time in seconds
 * @returns {Array<Object>} Active segments at the given time
 */
export function getActiveSegments(segments, time) {
  return segments.filter(segment => time >= segment.start && time <= segment.end);
}

