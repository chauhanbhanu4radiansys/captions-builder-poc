# 🎬 Motion-Typography Video Engine - Production Implementation

## Overview
Build a **complete, production-ready Python repository** for a GPU-accelerated motion-typography video renderer that transforms timestamped transcripts into cinematic text animations with hardware-accelerated encoding.

---

## 📋 Core Requirements

### Input Files (All in Root Directory)
- **`trx.json`** - Timestamped transcript with word-level timing
- **`v1.mp4`** - Input video file (for reference/composition)
- **`css.json`** - Style definitions using CSS-like animation DSL

### Expected Input Format Examples

**trx.json structure:**
```json
{
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Hello World",
      "words": [
        {"word": "Hello", "start": 0.0, "end": 1.2},
        {"word": "World", "start": 1.3, "end": 2.5}
      ]
    }
  ]
}
```

**css.json structure:**
```json
{
  "globalStyles": {
    "fontFamily": "Arial",
    "fontSize": 72,
    "resolution": [1920, 1080],
    "fps": 60,
    "backgroundColor": [0, 0, 0, 255]
  },
  "animations": [
    {
      "selector": "word",
      "keyframes": {
        "0%": {"opacity": 0, "scale": 0.8, "y": 50},
        "100%": {"opacity": 1, "scale": 1, "y": 0}
      },
      "duration": 0.5,
      "easing": "easeOutCubic"
    }
  ],
  "effects": {
    "blur": {"enabled": true, "radius": 5},
    "glow": {"enabled": true, "intensity": 0.3, "color": [255, 200, 100]},
    "shadow": {"offsetX": 2, "offsetY": 2, "blur": 4, "color": [0, 0, 0, 128]}
  }
}
```

---

## 🏗️ Technical Architecture

### Rendering Pipeline
```
Input Files → DSL Parser → Timeline Compiler → Animation Engine →
Skia Renderer (CPU) → GPU Transfer → CUDA Effects Processing →
Frame Compositor → FFmpeg NVENC Encoder → Output Video
```

### Performance Targets
- **1080p60**: Real-time or faster (≥60 FPS render speed)
- **4K60**: ≥30 FPS render speed
- **GPU Memory**: <4GB for typical 30-second clips
- **Latency**: <100ms from frame request to encoded output

---

## 📁 Required Repository Structure
```
motion-typography-engine/
├── engine/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration management
│   │   ├── types.py             # Type definitions & dataclasses
│   │   └── exceptions.py        # Custom exceptions
│   ├── dsl/
│   │   ├── __init__.py
│   │   ├── parser.py            # Parse css.json & trx.json
│   │   ├── validator.py         # Validate DSL schemas
│   │   ├── keyframes.py         # Keyframe interpolation engine
│   │   └── easing.py            # Easing functions (30+ types)
│   ├── render/
│   │   ├── __init__.py
│   │   ├── skia_renderer.py     # Skia text rendering
│   │   ├── text_layout.py       # Text positioning & wrapping
│   │   ├── font_manager.py      # Font loading & caching
│   │   └── surface_pool.py      # Skia surface memory pooling
│   ├── gpu/
│   │   ├── __init__.py
│   │   ├── device_manager.py    # CUDA device selection
│   │   ├── effects/
│   │   │   ├── __init__.py
│   │   │   ├── blur.py          # Separable Gaussian blur
│   │   │   ├── glow.py          # Bloom/glow effect
│   │   │   ├── warp.py          # Motion distortion
│   │   │   ├── color_grade.py   # Color correction
│   │   │   └── base.py          # Effect base class
│   │   └── utils.py             # GPU memory & transfer utils
│   ├── video/
│   │   ├── __init__.py
│   │   ├── ffmpeg_encoder.py    # NVENC encoding pipeline
│   │   ├── frame_buffer.py      # Circular frame buffer
│   │   └── video_reader.py      # Input video handling
│   └── pipeline.py              # Main orchestration
├── examples/
│   ├── basic_render.py          # Simple usage example
│   ├── advanced_effects.py      # Complex animation demo
│   ├── batch_render.py          # Multi-video processing
│   └── custom_effect.py         # Extending with custom effects
├── docs/
│   ├── API.md                   # API reference
│   ├── DSL_SPEC.md             # Complete DSL documentation
│   ├── PERFORMANCE.md          # Optimization guide
│   └── TROUBLESHOOTING.md      # Common issues
├── trx.json                     # Sample transcript (root)
├── css.json                     # Sample styles (root)
├── v1.mp4                       # Sample video (root)
├── requirements.txt
├── setup.py
├── .env.example
├── .gitignore
└── README.md
```

---

## 🎨 DSL Specifications

### Animation Properties
Must support all of:
- **Transform**: `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotation`, `skewX`, `skewY`
- **Appearance**: `opacity`, `color` (gradient support), `blur`, `brightness`
- **Text**: `fontSize`, `letterSpacing`, `lineHeight`, `fontWeight`
- **Effects**: `shadow`, `glow`, `stroke`, `gradient`

### Easing Functions (Required)
Implement at minimum:
- Linear
- Quadratic: `easeIn`, `easeOut`, `easeInOut`
- Cubic: `easeIn`, `easeOut`, `easeInOut`
- Quartic: `easeIn`, `easeOut`, `easeInOut`
- Sine: `easeIn`, `easeOut`, `easeInOut`
- Exponential: `easeIn`, `easeOut`, `easeInOut`
- Elastic: `easeIn`, `easeOut`, `easeInOut`
- Bounce: `easeIn`, `easeOut`, `easeInOut`
- Back: `easeIn`, `easeOut`, `easeInOut`

### Selectors
- `word` - Individual words
- `line` - Complete lines
- `segment` - Transcript segments
- `character` - Individual characters (advanced)

---

## 💻 Implementation Requirements

### 1. Skia Rendering Module
```python
# Must support:
- Offscreen RGBA surfaces
- Hardware-accelerated text shaping
- Gradient fills (linear, radial, angular)
- Multi-layer compositing
- Glyph caching (LRU cache)
- TextBlob optimization
- Subpixel antialiasing
```

### 2. GPU Effects (PyTorch CUDA Required)
```python
# Each effect must implement:
class BaseEffect:
    def __init__(self, device: torch.device)
    def apply(self, frame: torch.Tensor) -> torch.Tensor
    def to(self, device: torch.device)
    def parameters(self) -> dict  # For serialization
```

**Required Effects:**
- **Gaussian Blur**: Separable kernel, radius 0-50px
- **Glow/Bloom**: Threshold-based with intensity control
- **Motion Warp**: Optical flow-based distortion
- **Color Grade**: LUT-based color correction (optional but recommended)

### 3. FFmpeg Integration
```bash
# Must support NVENC with:
- h264_nvenc (primary)
- hevc_nvenc (fallback)
- Preset: p1 (fastest) to p7 (highest quality)
- Rate control: CBR, VBR, CQ
- B-frames configuration
- Lookahead optimization
```

### 4. Configuration Management
Use environment variables + config files:
```python
# .env support for:
CUDA_VISIBLE_DEVICES=0
FFMPEG_PATH=/usr/bin/ffmpeg
NVENC_PRESET=p4
OUTPUT_BITRATE=10M
CACHE_DIR=/tmp/motion-typo-cache
```

---

## 📖 Documentation Requirements

### README.md Must Include:
1. **Quick Start** (5 commands to first video)
2. **Architecture Overview** (with diagram)
3. **Installation**:
   - System dependencies (CUDA 11.8+, FFmpeg with NVENC)
   - Python dependencies
   - GPU driver requirements (NVIDIA 525+)
4. **Usage Examples**:
   - Basic rendering
   - Custom animations
   - Batch processing
5. **DSL Reference** (link to docs/DSL_SPEC.md)
6. **Performance Tuning**
7. **Troubleshooting** (CUDA, FFmpeg, memory issues)
8. **API Reference** (link to docs/API.md)

### DSL_SPEC.md Must Include:
- Complete schema with JSON examples
- All animation properties with value ranges
- Selector syntax and precedence
- Easing function visualization
- Advanced techniques (stagger, sequences)

---

## 🚀 Example Script Requirements

**examples/basic_render.py** must:
```python
# 1. Load files from root
transcript = load_transcript("../trx.json")
styles = load_styles("../css.json")
video = load_video("../v1.mp4")  # Optional background

# 2. Initialize engine
engine = MotionTypographyEngine(
    resolution=(1920, 1080),
    fps=60,
    device="cuda:0"
)

# 3. Compile animation
timeline = engine.compile(transcript, styles)

# 4. Render with progress bar
output = engine.render(
    timeline,
    output_path="output.mp4",
    background=video,  # Optional
    progress=True
)

# 5. Validate output
assert output.exists()
assert output.duration == transcript.duration
```

**Must produce a working video in <30 seconds** for a 10-second transcript on RTX 3060+.

---

## 🎯 Code Quality Standards

### Required:
- **Type hints** on all public functions
- **Docstrings** (Google style) for all classes/functions
- **Error handling** with custom exceptions
- **Logging** (Python logging module, configurable levels)
- **Memory profiling** markers for GPU operations
- **PEP 8** compliance (use `black` formatter)
- **No hardcoded paths** (use pathlib.Path)
- **Context managers** for resources (files, CUDA streams)

### Design Patterns:
- Factory pattern for effect instantiation
- Strategy pattern for easing functions
- Observer pattern for progress callbacks
- Pool pattern for Skia surface reuse

---

## 🔧 Dependencies (requirements.txt)
```txt
# Core
numpy>=1.24.0
torch>=2.0.0+cu118  # CUDA 11.8
skia-python>=87.5
Pillow>=10.0.0

# Video
ffmpeg-python>=0.2.0

# Utilities
pydantic>=2.0.0     # DSL validation
python-dotenv>=1.0.0
tqdm>=4.65.0
loguru>=0.7.0       # Better logging

# Optional performance
cupy-cuda11x>=12.0.0  # Alternative to PyTorch for some effects
numba>=0.57.0         # JIT compilation
```

---

## ✅ Acceptance Criteria

### Must Pass:
1. ✅ `python examples/basic_render.py` - Produces valid MP4
2. ✅ Video plays in VLC/Chrome with correct timing
3. ✅ GPU memory stays <4GB for 1080p60 30-second clip
4. ✅ Render speed ≥1x real-time on RTX 3060
5. ✅ README instructions work on fresh Ubuntu 22.04 install

### Output Video Quality:
- No frame drops or stutters
- Text perfectly synchronized with timestamps
- Effects apply smoothly without artifacts
- Colors match DSL specifications
- No memory leaks during 5+ minute renders
---

## 📦 Deliverables Checklist

- [ ] Complete repository with all files implemented
- [ ] Working examples that run without modification
- [ ] Comprehensive README with setup instructions
- [ ] DSL specification document with examples
- [ ] Type-checked codebase
- [ ] Output video from example renders correctly

---

**Constraint**: All code must be **production-ready**, not pseudocode or placeholders. Every function must be fully implemented and functional. The example must successfully render a video using the provided trx.json, css.json, and v1.mp4 files from the root directory.