# API Reference

Complete API documentation for the Motion Typography Engine.

## MotionTypographyEngine

Main engine class for rendering motion typography videos.

### `__init__(resolution, fps, device)`

Initialize the engine.

**Parameters:**
- `resolution` (Tuple[int, int]): Output video resolution (width, height). Default: (1920, 1080)
- `fps` (int): Frames per second. Default: 60
- `device` (Optional[str]): CUDA device string (e.g., "cuda:0"). Default: from config

**Example:**
```python
engine = MotionTypographyEngine(
    resolution=(1920, 1080),
    fps=60,
    device="cuda:0"
)
```

### `compile(transcript, styles) -> Timeline`

Compile transcript and styles into a renderable timeline.

**Parameters:**
- `transcript` (Transcript): Parsed transcript object
- `styles` (StyleConfig): Style configuration

**Returns:**
- `Timeline`: Compiled timeline with frames

**Example:**
```python
timeline = engine.compile(transcript, styles)
```

### `render(timeline, output_path, background, progress) -> Path`

Render timeline to video file.

**Parameters:**
- `timeline` (Timeline): Compiled timeline
- `output_path` (str): Output video file path
- `background` (Optional[str]): Optional background video path
- `progress` (bool): Show progress bar. Default: True

**Returns:**
- `Path`: Path to output file

**Example:**
```python
output = engine.render(
    timeline,
    output_path="output.mp4",
    background="background.mp4",
    progress=True
)
```

### `load_transcript(file_path) -> Transcript`

Static method to load transcript from JSON file.

**Parameters:**
- `file_path` (str): Path to transcript JSON file

**Returns:**
- `Transcript`: Parsed transcript object

### `load_styles(file_path) -> StyleConfig`

Static method to load styles from JSON file.

**Parameters:**
- `file_path` (str): Path to styles JSON file

**Returns:**
- `StyleConfig`: Parsed style configuration

## Core Types

### Transcript

Represents a complete transcript with segments and words.

**Attributes:**
- `segments` (List[Segment]): List of transcript segments
- `duration` (float): Total duration in seconds
- `language` (Optional[str]): Language code
- `text` (Optional[str]): Full text

### Segment

Represents a segment of transcript.

**Attributes:**
- `text` (str): Segment text
- `start` (float): Start time in seconds
- `end` (float): End time in seconds
- `words` (List[Word]): List of words in segment
- `id` (Optional[int]): Segment ID
- `speaker_id` (Optional[str]): Speaker identifier

### Word

Represents a single word with timing.

**Attributes:**
- `text` (str): Word text
- `start` (float): Start time in seconds
- `end` (float): End time in seconds
- `id` (Optional[int]): Word ID

### StyleConfig

Global style configuration.

**Attributes:**
- `font_family` (str): Font family name
- `font_size` (int): Font size in pixels
- `resolution` (Tuple[int, int]): Video resolution
- `fps` (int): Frames per second
- `background_color` (Tuple[int, int, int, int]): RGBA background color
- `animations` (List[Animation]): List of animations
- `effects` (Optional[EffectConfig]): Visual effects configuration

### Animation

Animation configuration.

**Attributes:**
- `selector` (str): Target selector ("word", "line", "segment", "character")
- `keyframes` (Dict[str, Dict[str, Any]]): Keyframe definitions
- `duration` (float): Animation duration in seconds
- `easing` (str): Easing function name
- `delay` (float): Delay before animation starts
- `stagger` (Optional[float]): Delay between elements

## GPU Effects

### BaseEffect

Base class for all GPU effects.

**Methods:**
- `apply(frame: torch.Tensor) -> torch.Tensor`: Apply effect to frame
- `to(device: torch.device) -> BaseEffect`: Move to different device
- `parameters() -> Dict[str, Any]`: Get effect parameters

### GaussianBlur

Separable Gaussian blur effect.

**Parameters:**
- `device` (torch.device): CUDA device
- `radius` (int): Blur radius (0-50). Default: 5

### GlowEffect

Glow/Bloom effect.

**Parameters:**
- `device` (torch.device): CUDA device
- `intensity` (float): Glow intensity (0.0-1.0). Default: 0.3
- `threshold` (float): Brightness threshold (0.0-1.0). Default: 0.8
- `radius` (int): Blur radius. Default: 10
- `color` (Optional[tuple]): Color tint (R, G, B). Default: None

## Easing Functions

Available easing functions:
- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInQuartic`, `easeOutQuartic`, `easeInOutQuartic`
- `easeInSine`, `easeOutSine`, `easeInOutSine`
- `easeInExponential`, `easeOutExponential`, `easeInOutExponential`
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic`
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce`
- `easeInBack`, `easeOutBack`, `easeInOutBack`

## Exceptions

### MotionTypographyError

Base exception for all engine errors.

### DSLParseError

Raised when DSL parsing fails.

### RenderError

Raised when rendering fails.

### GPUError

Raised when GPU operations fail.

### EncodingError

Raised when video encoding fails.

