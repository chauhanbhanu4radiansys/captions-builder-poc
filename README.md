# 🎬 Motion Typography Video Engine

A production-ready, GPU-accelerated motion typography video renderer that transforms timestamped transcripts into cinematic text animations with hardware-accelerated encoding.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Ensure FFmpeg with NVENC is installed
ffmpeg -encoders | grep nvenc

# 3. Run basic example
python examples/basic_render.py

# 4. Check output
ls -lh output.mp4
```

## 📋 Requirements

### System Dependencies
- **CUDA 11.8+** with compatible NVIDIA drivers (525+)
- **FFmpeg** with NVENC support
- **Python 3.8+**

### GPU Requirements
- NVIDIA GPU with CUDA support
- Minimum 4GB VRAM (recommended 8GB+)

### Installation

#### Ubuntu 22.04

```bash
# Install CUDA toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda-toolkit-11-8

# Install FFmpeg with NVENC
sudo apt-get install ffmpeg

# Verify NVENC
ffmpeg -encoders | grep nvenc
```

#### Python Dependencies

```bash
pip install -r requirements.txt
```

## 🏗️ Architecture

```
Input Files → DSL Parser → Timeline Compiler → Animation Engine →
Skia Renderer (CPU) → GPU Transfer → CUDA Effects Processing →
Frame Compositor → FFmpeg NVENC Encoder → Output Video
```

### Key Components

- **DSL Parser**: Parses JSON transcript and style definitions
- **Timeline Compiler**: Builds frame-by-frame animation timeline
- **Skia Renderer**: Hardware-accelerated text rendering
- **GPU Effects**: CUDA-accelerated blur, glow, and other effects
- **FFmpeg Encoder**: Hardware-accelerated video encoding

## 📖 Usage

### Basic Example

```python
from engine import MotionTypographyEngine

# Load files
transcript = MotionTypographyEngine.load_transcript("trx.json")
styles = MotionTypographyEngine.load_styles("css.json")

# Initialize engine
engine = MotionTypographyEngine(
    resolution=(1920, 1080),
    fps=60,
    device="cuda:0"
)

# Compile and render
timeline = engine.compile(transcript, styles)
output = engine.render(
    timeline,
    output_path="output.mp4",
    background="v1.mp4",  # Optional
    progress=True
)
```

### Advanced Effects

See `examples/advanced_effects.py` for custom animations and effects.

### Batch Processing

See `examples/batch_render.py` for processing multiple videos.

## 📁 Project Structure

```
motion-typography-engine/
├── engine/
│   ├── core/           # Configuration, types, exceptions
│   ├── dsl/            # DSL parser and validator
│   ├── render/         # Skia text rendering
│   ├── gpu/            # CUDA effects processing
│   ├── video/          # FFmpeg encoding
│   └── pipeline.py     # Main orchestrator
├── examples/           # Usage examples
├── docs/              # Documentation
└── requirements.txt   # Dependencies
```

## 🎨 DSL Specification

The engine uses JSON-based DSL for defining animations. See [DSL_SPEC.md](docs/DSL_SPEC.md) for complete documentation.

### Transcript Format (trx.json)

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

### Style Format (css.json)

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

## ⚡ Performance

### Benchmarks (RTX 3060)

- **1080p60**: Real-time or faster (≥60 FPS render speed)
- **4K60**: ≥30 FPS render speed
- **GPU Memory**: <4GB for typical 30-second clips
- **Latency**: <100ms from frame request to encoded output

### Optimization Tips

See [PERFORMANCE.md](docs/PERFORMANCE.md) for detailed optimization guide.

## 🔧 Configuration

Create a `.env` file (see `.env.example`) to configure:

- CUDA device selection
- FFmpeg paths and encoding settings
- Cache directories
- Memory limits
- Logging levels

## 📚 Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [DSL Specification](docs/DSL_SPEC.md) - Animation DSL reference
- [Performance Guide](docs/PERFORMANCE.md) - Optimization tips
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🐛 Troubleshooting

### CUDA Issues

```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Check GPU
nvidia-smi
```

### FFmpeg Issues

```bash
# Verify NVENC support
ffmpeg -encoders | grep nvenc

# Test encoding
ffmpeg -f lavfi -i testsrc2 -t 1 -c:v h264_nvenc test.mp4
```

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more solutions.

## 📝 License

MIT License

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

## 🙏 Acknowledgments

- Skia for text rendering
- PyTorch for GPU acceleration
- FFmpeg for video encoding

