# Troubleshooting Guide

Common issues and solutions.

## CUDA Issues

### CUDA Not Available

**Error:** `GPUError: CUDA is not available`

**Solutions:**
1. Check CUDA installation:
   ```bash
   nvidia-smi
   python -c "import torch; print(torch.cuda.is_available())"
   ```

2. Install PyTorch with CUDA:
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

3. Verify CUDA version matches PyTorch:
   ```bash
   nvcc --version
   python -c "import torch; print(torch.version.cuda)"
   ```

### Out of Memory

**Error:** `RuntimeError: CUDA out of memory`

**Solutions:**
1. Reduce resolution:
   ```python
   engine = MotionTypographyEngine(resolution=(1280, 720))
   ```

2. Lower frame rate:
   ```python
   engine = MotionTypographyEngine(fps=30)
   ```

3. Limit GPU memory in `.env`:
   ```
   MAX_GPU_MEMORY_GB=2.0
   ```

4. Clear cache:
   ```python
   device_manager.clear_cache()
   ```

## FFmpeg Issues

### NVENC Not Found

**Error:** `EncodingError: Failed to start FFmpeg`

**Solutions:**
1. Verify NVENC support:
   ```bash
   ffmpeg -encoders | grep nvenc
   ```

2. Install FFmpeg with NVENC:
   ```bash
   # Ubuntu
   sudo apt-get install ffmpeg
   
   # Or build from source with --enable-nvenc
   ```

3. Check FFmpeg path in `.env`:
   ```
   FFMPEG_PATH=/usr/bin/ffmpeg
   ```

### Encoding Fails

**Error:** `EncodingError: FFmpeg encoding timed out`

**Solutions:**
1. Test FFmpeg manually:
   ```bash
   ffmpeg -f lavfi -i testsrc2 -t 1 -c:v h264_nvenc test.mp4
   ```

2. Try different codec:
   ```
   NVENC_CODEC=hevc_nvenc
   ```

3. Use software encoding (slower):
   ```python
   # Modify FFmpegEncoder to use libx264
   ```

## Rendering Issues

### Text Not Appearing

**Possible Causes:**
1. Opacity set to 0 in keyframes
2. Text color matches background
3. Font not found

**Solutions:**
1. Check animation keyframes
2. Verify font family exists
3. Check text color values

### Wrong Timing

**Possible Causes:**
1. Timestamp mismatch in transcript
2. FPS mismatch

**Solutions:**
1. Validate transcript timestamps
2. Ensure FPS matches style config

### Poor Quality

**Solutions:**
1. Increase resolution
2. Use higher quality preset:
   ```
   NVENC_PRESET=p7
   ```
3. Increase bitrate:
   ```
   OUTPUT_BITRATE=20M
   ```

## Font Issues

### Font Not Found

**Error:** `FontError: Font not found`

**Solutions:**
1. Install system fonts
2. Use common font families (Arial, Helvetica)
3. Provide font file path in FontManager

### Text Rendering Errors

**Solutions:**
1. Check font size (must be positive)
2. Verify text encoding (UTF-8)
3. Check for special characters

## Performance Issues

### Slow Rendering

**Solutions:**
1. Reduce resolution
2. Lower FPS
3. Disable effects
4. Use faster NVENC preset
5. Check GPU utilization

### High Memory Usage

**Solutions:**
1. Reduce frame buffer size
2. Lower surface pool size
3. Process in smaller chunks
4. Clear cache regularly

## File Issues

### File Not Found

**Error:** `DSLParseError: File not found`

**Solutions:**
1. Check file paths are correct
2. Use absolute paths
3. Verify file permissions

### Invalid JSON

**Error:** `DSLParseError: Invalid JSON`

**Solutions:**
1. Validate JSON syntax
2. Check for trailing commas
3. Verify encoding (UTF-8)

## Getting Help

1. Check logs (set `LOG_LEVEL=DEBUG` in `.env`)
2. Verify system requirements
3. Test with minimal example
4. Check GPU drivers are up to date
5. Review error messages carefully

## Common Error Messages

| Error | Solution |
|-------|----------|
| `CUDA is not available` | Install CUDA toolkit and PyTorch with CUDA |
| `FFmpeg not found` | Install FFmpeg and set FFMPEG_PATH |
| `NVENC not supported` | Install FFmpeg with NVENC support |
| `Out of memory` | Reduce resolution, FPS, or effects |
| `Invalid JSON` | Validate JSON syntax |
| `Font not found` | Use system fonts or provide font path |

