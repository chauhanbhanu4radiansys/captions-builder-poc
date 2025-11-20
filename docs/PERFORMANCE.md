# Performance Optimization Guide

Tips and techniques for optimizing render performance.

## GPU Memory Management

### Monitor Memory Usage

```python
from engine.gpu.device_manager import DeviceManager

device_manager = DeviceManager("cuda:0")
info = device_manager.get_memory_info()
print(f"Allocated: {info['allocated']:.2f} GB")
print(f"Reserved: {info['reserved']:.2f} GB")
```

### Limit Memory Usage

Set in `.env`:
```
MAX_GPU_MEMORY_GB=4.0
```

### Clear Cache

```python
device_manager.clear_cache()
```

## Rendering Optimization

### Reduce Resolution

Lower resolution significantly improves performance:
- 1080p: ~60 FPS
- 4K: ~30 FPS

### Lower Frame Rate

For non-critical animations, 30 FPS is often sufficient:
```python
engine = MotionTypographyEngine(fps=30)
```

### Disable Unnecessary Effects

Effects add processing overhead:
```python
# Disable blur if not needed
effects = EffectConfig(blur={"enabled": False})
```

## FFmpeg Encoding

### Use Fastest Preset

For faster encoding:
```
NVENC_PRESET=p1  # Fastest
```

For better quality:
```
NVENC_PRESET=p7  # Highest quality
```

### Adjust Bitrate

Lower bitrate = faster encoding:
```
OUTPUT_BITRATE=5M  # Lower bitrate
```

## Surface Pooling

Increase surface pool size for better memory reuse:
```
SURFACE_POOL_SIZE=20
```

## Frame Buffer

Adjust frame buffer size based on available RAM:
```
FRAME_BUFFER_SIZE=120  # Larger buffer
```

## Batch Processing

For multiple videos, reuse engine instance:

```python
engine = MotionTypographyEngine()

for transcript_file in transcript_files:
    timeline = engine.compile(transcript, styles)
    engine.render(timeline, output_path)
```

## Profiling

### Time Rendering

```python
import time

start = time.time()
engine.render(timeline, output_path)
duration = time.time() - start
print(f"Render time: {duration:.2f}s")
```

### Profile GPU Usage

```bash
nvidia-smi dmon -s u -c 100
```

## Best Practices

1. **Pre-compile timelines** when possible
2. **Reuse engine instances** for batch processing
3. **Disable unused effects** to reduce overhead
4. **Use appropriate resolution** for target output
5. **Monitor GPU memory** to avoid OOM errors
6. **Clear cache** between large renders

## Troubleshooting Slow Renders

1. Check GPU utilization: `nvidia-smi`
2. Verify CUDA is being used
3. Check FFmpeg encoding speed
4. Monitor CPU usage (Skia rendering)
5. Reduce effects complexity
6. Lower resolution/fps for testing

