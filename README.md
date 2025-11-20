# Video Caption Renderer

A production-grade Node.js backend that applies animated, CSS-styled captions to videos using **Skia Canvas**, **FFmpeg**, and modern rendering techniques. The system renders kinetic-typography-style captions with blur effects, gradients, per-word animations, and smooth easing curves.

## 🎯 Features

- **High-Performance Rendering**: Uses Skia Canvas for efficient frame rendering
- **Animated Captions**: Support for container and word-level animations with easing
- **CSS-Style Configuration**: Define styles and animations using familiar CSS-like syntax
- **Per-Word Animations**: Staggered word reveals with customizable timing
- **Gradient Support**: Linear and radial gradients for caption backgrounds
- **Streaming Pipeline**: Direct streaming to FFmpeg (no intermediate files)
- **Production-Ready**: Comprehensive error handling, logging, and progress tracking

## 📋 Prerequisites

- **Node.js** 18+ (ES modules support required)
- **FFmpeg** installed and available in PATH
- **npm** or **yarn** package manager

### Installing FFmpeg

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [FFmpeg official website](https://ffmpeg.org/download.html) and add to PATH.

## 🚀 Installation

1. **Clone or navigate to the project directory:**
```bash
cd captions-builder-poc
```

2. **Install dependencies:**
```bash
npm install
```

## 📖 Usage

### Basic Usage

1. **Prepare your files:**
   - `trx.json` - Transcript file with word timings (see format below)
   - `v1.mp4` - Input video file
   - `css.json` - Style configuration (see format below)

2. **Run the renderer:**
```bash
npm start
```

3. **Output:**
   - Rendered video will be saved to `dist/output.mp4`

### Configuration via Environment Variables

You can override default paths and settings using environment variables:

```bash
TRANSCRIPT_PATH=./trx.json \
VIDEO_PATH=./v1.mp4 \
CSS_PATH=./css.json \
OUTPUT_PATH=./dist/output.mp4 \
FPS=30 \
WIDTH=1920 \
HEIGHT=1080 \
FFMPEG_PRESET=veryfast \
FFMPEG_CRF=25 \
DEBUG=false \
SKIP_EMPTY_FRAMES=true \
npm start
```

### Performance Optimization

The renderer includes several performance optimizations:

1. **Empty Frame Caching**: Automatically caches empty frames (no captions) to avoid expensive `getImageData()` calls - **major speedup for videos with sparse captions**
2. **FFmpeg Preset**: Default is `veryfast` (optimized for speed). Options: `ultrafast`, `veryfast`, `faster`, `fast`, `medium`, `slow`, `slower`, `veryslow`
3. **CRF (Quality)**: Default is `25` (good quality, fast encoding). Lower = better quality but slower (18-28 recommended)
4. **Debug Mode**: Set `DEBUG=true` to enable verbose logging (disabled by default for performance)
5. **Skip Empty Frames**: Enabled by default - skips all rendering work when no captions are active

**For maximum speed** (lower quality):
```bash
FFMPEG_PRESET=ultrafast FFMPEG_CRF=28 npm start
```

**For best quality** (slower):
```bash
FFMPEG_PRESET=slow FFMPEG_CRF=18 npm start
```

**Performance Tips:**
- Videos with sparse captions (few caption segments) will process much faster due to empty frame caching
- For 10-minute videos with captions only 10% of the time, expect 5-10x speedup
- The renderer automatically skips `getImageData()` calls for empty frames, which is the biggest bottleneck

## 📁 File Formats

### Transcript Format (`trx.json`)

The transcript file can be in one of these formats:

**Format 1: Direct array**
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

**Format 2: Nested structure**
```json
{
  "transcription_data": {
    "segments": [
      {
        "text": "Hello world",
        "start": 1.20,
        "end": 3.50,
        "words": [...]
      }
    ]
  }
}
```

### CSS Configuration (`css.json`)

```json
{
  "cueStyles": {
    "fontSize": "48px",
    "fontWeight": "700",
    "fontFamily": "Arial",
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
      "duration": 0.3,
      "keyframes": [
        { "time": 0, "opacity": 0, "translateY": 30, "scale": 0.9 },
        { "time": 1, "opacity": 1, "translateY": 0, "scale": 1 }
      ],
      "easing": "ease-out"
    },
    "containerOut": {
      "duration": 0.3,
      "keyframes": [
        { "time": 0, "opacity": 1, "translateY": 0, "scale": 1 },
        { "time": 1, "opacity": 0, "translateY": -30, "scale": 0.9 }
      ],
      "easing": "ease-in"
    },
    "wordIn": {
      "duration": 0.2,
      "stagger": 0.05,
      "keyframes": [
        { "time": 0, "opacity": 0, "translateY": 20, "scale": 0.8 },
        { "time": 1, "opacity": 1, "translateY": 0, "scale": 1 }
      ],
      "easing": "ease-out"
    }
  },
  "gradient": {
    "type": "linear",
    "angle": 135,
    "colors": ["#667eea", "#764ba2"]
  }
}
```

### Animation Properties

Animations support the following transform properties:
- `opacity` (0-1): Transparency
- `translateX` (pixels): Horizontal translation
- `translateY` (pixels): Vertical translation
- `scale` (number): Scale factor (1.0 = 100%)
- `rotation` (degrees): Rotation angle
- `blur` (pixels): Blur radius

### Easing Functions

Available easing functions:
- `linear` - No easing
- `ease-in` / `easeIn` - Slow start
- `ease-out` / `easeOut` - Slow end
- `ease-in-out` / `easeInOut` - Slow start and end
- `back` - Overshoots slightly
- `bounce` - Bouncing effect
- `elastic` - Elastic effect
- `cubic-bezier(x1, y1, x2, y2)` - Custom cubic bezier curve

## 🏗️ Architecture

```
┌─────────────────┐
│   index.js      │  Main entry point
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
┌───▼───┐ ┌──▼──────┐
│ Config│ │ Logger  │  Utilities
└───────┘ └─────────┘
    │
┌───▼──────────────┐
│ CaptionEngine    │  Animation orchestration
│  └─ Timeline     │
│  └─ Easing       │
└───┬──────────────┘
    │
┌───▼──────────────┐
│ SkiaRenderer     │  Frame rendering
│  └─ FrameBuffer  │
└───┬──────────────┘
    │
┌───▼──────────────┐
│ FFmpegPipeline   │  Video encoding
└──────────────────┘
```

### Component Overview

1. **Config Manager** (`src/utils/config.js`): Loads and validates configuration
2. **Logger** (`src/utils/logger.js`): Structured logging with progress tracking
3. **Transcript Parser** (`src/utils/parseTranscript.js`): Parses transcript formats
4. **CSS Converter** (`src/utils/cssToSkia.js`): Converts CSS to Skia API calls
5. **Caption Engine** (`src/animation/captionEngine.js`): Manages caption timing and animations
6. **Timeline** (`src/animation/timeline.js`): Keyframe interpolation and evaluation
7. **Easing** (`src/animation/easing.js`): Easing function library
8. **Skia Renderer** (`src/core/skiaRenderer.js`): Renders frames using Skia Canvas
9. **Frame Buffer** (`src/core/frameBuffer.js`): Manages RGBA pixel buffers
10. **FFmpeg Pipeline** (`src/core/ffmpegPipeline.js`): Streams frames to FFmpeg

## 🔧 Troubleshooting

### FFmpeg Not Found

**Error:** `FFmpeg process error: spawn ffmpeg ENOENT`

**Solution:** Ensure FFmpeg is installed and available in your PATH. Test with:
```bash
ffmpeg -version
```

### Video Metadata Read Failure

**Error:** `Failed to get video metadata`

**Solution:** 
- Verify the video file exists and is readable
- Check that the video file is not corrupted
- Ensure fluent-ffmpeg can access ffprobe

### Memory Issues

**Error:** Out of memory errors during rendering

**Solution:**
- Reduce video resolution
- Process shorter video segments
- Increase Node.js memory limit: `node --max-old-space-size=4096 src/index.js`

### Skia Canvas Issues

**Error:** Canvas rendering errors

**Solution:**
- Ensure `skia-canvas` is properly installed
- Check that system dependencies for Skia are installed
- On Linux, you may need: `sudo apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

### Caption Positioning Issues

**Problem:** Captions appear in wrong position

**Solution:**
- Check video dimensions match configuration
- Verify caption bounds calculation
- Adjust padding and positioning in CSS config

## ⚡ Performance Tips

1. **Optimize FFmpeg Settings:**
   - Use `preset=fast` for faster encoding (lower quality)
   - Use `preset=slow` for better quality (slower encoding)
   - Adjust CRF: lower = better quality, higher = smaller file size

2. **Reduce Frame Rate:**
   - For non-critical videos, use 24 FPS instead of 30/60 FPS
   - Reduces rendering time significantly

3. **Optimize Caption Complexity:**
   - Reduce number of concurrent captions
   - Simplify animations (fewer keyframes)
   - Disable blur effects if not needed

4. **Hardware Acceleration:**
   - Use GPU-accelerated encoding if available
   - Modify FFmpeg args to use hardware encoders (e.g., `h264_nvenc`)

## 📝 Development

### Project Structure

```
captions-builder-poc/
├── src/
│   ├── core/
│   │   ├── skiaRenderer.js
│   │   ├── frameBuffer.js
│   │   └── ffmpegPipeline.js
│   ├── animation/
│   │   ├── timeline.js
│   │   ├── easing.js
│   │   └── captionEngine.js
│   ├── utils/
│   │   ├── cssToSkia.js
│   │   ├── parseTranscript.js
│   │   ├── logger.js
│   │   └── config.js
│   └── index.js
├── dist/              # Output directory
├── trx.json           # Input transcript
├── v1.mp4             # Input video
├── css.json           # Style configuration
├── package.json
└── README.md
```

### Running in Development Mode

```bash
npm run dev
```

This runs with `--watch` flag for automatic restarts on file changes.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows ES module syntax
- All functions have JSDoc comments
- Error handling is comprehensive
- Tests are added for new features

## 🐛 Known Issues

- Backdrop blur effect is approximated (Skia Canvas doesn't support true backdrop-filter)
- Complex gradients may have performance impact
- Very long videos (>10 minutes) may require memory optimization

## 📚 Additional Resources

- [Skia Canvas Documentation](https://github.com/samizdatco/skia-canvas)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Fluent FFmpeg Documentation](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

