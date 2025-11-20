# Production-Grade Video Caption Rendering Engine

## 🎯 **Project Overview**

Build a high-performance Node.js backend that applies animated, CSS-styled captions to videos using **Skia Canvas**, **FFmpeg**, and modern rendering techniques. The system renders kinetic-typography-style captions with blur effects, gradients, per-word animations, and smooth easing curves.

---

## 📁 **Project Structure**

```
/video-caption-renderer
├── /src
│   ├── /core
│   │   ├── skiaRenderer.js       # Skia-based frame renderer
│   │   ├── frameBuffer.js         # RGBA frame buffer management
│   │   └── ffmpegPipeline.js      # FFmpeg streaming pipeline
│   ├── /animation
│   │   ├── timeline.js            # Timeline and keyframe system
│   │   ├── easing.js              # Easing functions library
│   │   └── captionEngine.js       # Caption animation orchestrator
│   ├── /utils
│   │   ├── cssToSkia.js           # CSS-to-Skia style converter
│   │   ├── parseTranscript.js     # Transcript parser
│   │   ├── logger.js              # Logging utility
│   │   └── config.js              # Configuration manager
│   └── index.js                   # Main entry point
├── /dist                          # Output directory
├── trx.json                       # Input transcript (root level)
├── v1.mp4                         # Input video (root level)
├── css.json                       # Style configuration (root level)
├── package.json
└── README.md
```

---

## 🔧 **Technical Requirements**

### **1. Rendering Engine (`src/core/skiaRenderer.js`)**

**Use:** `skia-canvas` (preferred) or `node-canvas` with Skia backend

**Capabilities:**
- Render RGBA frames at configurable FPS (30/60)
- Draw primitives:
  - Rounded rectangles with custom radius
  - Linear/radial gradients
  - Text with custom fonts and weights
  - Blur effects (SkMaskFilter)
  - Drop shadows
  - Per-word transforms (translate, scale, rotate, opacity)
- **Critical:** Export frames to memory buffers, NOT disk files
- Support compositing modes (normal, multiply, screen)

**Output Format:** Raw RGBA pixel data as Buffer/Uint8Array

---

### **2. CSS-to-Skia Translator (`src/utils/cssToSkia.js`)**

**Parse from `css.json`:**

```javascript
{
  "cueStyles": {
    "fontSize": "48px",
    "fontWeight": "700",
    "fontFamily": "Inter",
    "color": "#FFFFFF",
    "backgroundColor": "rgba(0, 0, 0, 0.7)",
    "backdropFilter": "blur(12px)",
    "borderRadius": "16px",
    "padding": "20px 32px",
    "wordSpacing": "8px",
    "textShadow": "0 4px 12px rgba(0,0,0,0.5)"
  },
  "animationClasses": {
    "containerIn": {
      "keyframes": [
        { "time": 0, "opacity": 0, "translateY": 30, "scale": 0.9 },
        { "time": 0.3, "opacity": 1, "translateY": 0, "scale": 1 }
      ],
      "easing": "ease-out"
    },
    "containerOut": { /* ... */ },
    "wordIn": {
      "stagger": 0.05,
      "keyframes": [ /* ... */ ]
    }
  },
  "gradient": {
    "type": "linear",
    "angle": 135,
    "colors": ["#667eea", "#764ba2"]
  }
}
```

**Convert to Skia API calls:**
- `fontSize` → `ctx.font`
- `backgroundColor` → Skia Paint with color
- `backdropFilter: blur(X)` → `SkMaskFilter.MakeBlur()`
- `borderRadius` → rounded rectangle path
- `textShadow` → shadow layer

---

### **3. Animation System**

#### **`src/animation/timeline.js`**
- Playhead management (current time in seconds)
- Keyframe interpolation
- Support for multiple concurrent animations
- Stagger support for word-by-word reveals

#### **`src/animation/easing.js`**
Implement standard easing functions:
```javascript
{
  linear, easeIn, easeOut, easeInOut,
  cubicBezier(x1, y1, x2, y2),
  back, bounce, elastic
}
```

#### **`src/animation/captionEngine.js`**
- Load and parse `trx.json` transcript
- Split captions into words with timing
- Calculate animation windows for each word
- Generate transform matrices per frame:
  ```javascript
  {
    opacity: 0-1,
    translateX: number,
    translateY: number,
    scale: number,
    rotation: degrees,
    blur: pixels
  }
  ```

---

### **4. FFmpeg Streaming Pipeline (`src/core/ffmpegPipeline.js`)**

**Requirements:**
- Accept raw RGBA frames from renderer
- Stream to FFmpeg via `stdin` (no temp files)
- Use `-f rawvideo` input format

**Example Command:**
```bash
ffmpeg -y \
  -f rawvideo \
  -pixel_format rgba \
  -video_size 1920x1080 \
  -framerate 30 \
  -i pipe:0 \
  -i v1.mp4 \
  -filter_complex "[0:v][1:v]overlay=0:0" \
  -c:v libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  dist/output.mp4
```

**Features:**
- Overlay captions on input video
- Handle backpressure correctly
- Report progress (frames rendered)
- Error handling for FFmpeg crashes

---

## 📋 **Input File Specifications**

### **`trx.json` (Transcript)**
```json
[
  {
    "text": "Hello world example here",
    "start": 1.20,
    "end": 3.50,
    "words": [
      { "text": "Hello", "start": 1.20, "end": 1.35 },
      { "text": "world", "start": 1.40, "end": 1.60 },
      { "text": "example", "start": 1.65, "end": 2.00 },
      { "text": "here", "start": 2.05, "end": 2.30 }
    ]
  }
]
```

### **`v1.mp4`**
- Input video file (any resolution/codec)
- Duration determines total frames to render

### **`css.json`**
- Caption styling (see Section 2 above)
- Animation definitions
- Gradient configurations

---

## 🚀 **Main Entry Point (`src/index.js`)**

**Workflow:**

1. **Load Configuration**
   ```javascript
   const transcript = JSON.parse(fs.readFileSync('trx.json'));
   const styles = JSON.parse(fs.readFileSync('css.json'));
   const videoPath = 'v1.mp4';
   ```

2. **Initialize Systems**
   - Parse transcript with word timings
   - Convert CSS styles to Skia format
   - Get video metadata (duration, fps, dimensions)
   - Initialize Skia canvas renderer
   - Start FFmpeg pipeline

3. **Render Loop**
   ```javascript
   for (let frame = 0; frame < totalFrames; frame++) {
     const time = frame / fps;
     
     // Get active captions at current time
     const activeCaptions = captionEngine.getCaptionsAtTime(time);
     
     // Clear canvas
     renderer.clear();
     
     // For each active caption
     for (const caption of activeCaptions) {
       // Calculate container animation
       const containerTransform = timeline.evaluate(
         caption, 'container', time
       );
       
       // Render caption background
       renderer.drawCaptionBox(containerTransform, styles);
       
       // Render each word with staggered animation
       for (const word of caption.words) {
         const wordTransform = timeline.evaluateWord(
           word, time, caption.start
         );
         renderer.drawWord(word.text, wordTransform, styles);
       }
     }
     
     // Send frame to FFmpeg
     const frameBuffer = renderer.getFrameBuffer();
     ffmpeg.writeFrame(frameBuffer);
   }
   ```

4. **Finalize**
   - Close FFmpeg stdin
   - Wait for encoding completion
   - Log output file location

---

## 📦 **Package Dependencies**

```json
{
  "name": "video-caption-renderer",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "skia-canvas": "^1.0.0",
    "fluent-ffmpeg": "^2.1.2"
  },
  "devDependencies": {
    "eslint": "^8.0.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  }
}
```

---

## ✅ **Quality Requirements**

1. **Code Quality**
   - ES modules (`import`/`export`)
   - JSDoc comments for all public functions
   - Descriptive variable names
   - Error handling with try-catch
   - Input validation

2. **Performance**
   - Stream-based processing (no frame buffering)
   - Efficient Skia context reuse
   - Memory-conscious rendering

3. **Logging**
   - Progress indicators (% complete)
   - Performance metrics (FPS, render time)
   - Error messages with context

4. **Configuration**
   - No hard-coded paths
   - Configurable via `config.js`
   - Environment variable support

---

## 📖 **README Requirements**

Include:
1. **Installation** - Dependencies and setup
2. **Usage** - Basic command and examples
3. **Configuration** - How to modify styles/animations
4. **Architecture** - High-level system diagram
5. **Troubleshooting** - Common issues and solutions
6. **Performance Tips** - Optimization suggestions

---

## 🎬 **Expected Output**

Running `npm start` should:
1. Read `trx.json`, `css.json`, and `v1.mp4` from root
2. Render animated captions frame-by-frame
3. Overlay captions on the input video
4. Output to `dist/output.mp4`
5. Display progress: `Rendering: 45% (270/600 frames) - 30 FPS`
6. Complete in reasonable time (1-2x video duration for 1080p)

---

## 🔥 **Advanced Features (Optional)**

- Multiple caption tracks simultaneously
- Emoji rendering support
- Custom font loading
- GPU-accelerated blur (if possible with Skia)
- Real-time preview server
- Batch processing multiple videos

---

## 🚨 **Critical Notes**

1. **No Intermediate Files** - All frame data stays in memory/streams
2. **Accurate Timing** - Word animations must sync perfectly with audio
3. **Production-Ready** - Handle edge cases (empty captions, missing words, etc.)
4. **Cross-Platform** - Should work on Linux, macOS, Windows (where FFmpeg available)

---

## 🎯 **Success Criteria**

✅ Generates smooth 30/60 FPS video with captions  
✅ Animations match CSS-style definitions exactly  
✅ Per-word animations with proper stagger timing  
✅ No visual artifacts or flickering  
✅ Completes without memory leaks  
✅ All files included and properly documented  
✅ Can process 1-minute video in under 5 minutes

---

**GENERATE COMPLETE, PRODUCTION-READY CODE FOR ALL FILES NOW**