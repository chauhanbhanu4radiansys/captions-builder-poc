# DSL Specification

Complete specification for the Motion Typography Animation DSL.

## Transcript Format (trx.json)

### Structure

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
  ],
  "duration": 2.5,
  "language": "en"
}
```

### Fields

- **segments** (required): Array of segment objects
  - **start** (float): Start time in seconds
  - **end** (float): End time in seconds
  - **text** (string): Segment text
  - **words** (array): Array of word objects
    - **word** or **text** (string): Word text
    - **start** (float): Word start time
    - **end** (float): Word end time
    - **id** (optional, int): Word ID
  - **id** (optional, int): Segment ID
  - **speaker_id** (optional, string): Speaker identifier

- **duration** (float): Total transcript duration
- **language** (optional, string): Language code

## Style Format (css.json)

### Structure

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
      "easing": "easeOutCubic",
      "delay": 0.0,
      "stagger": 0.1
    }
  ],
  "effects": {
    "blur": {"enabled": true, "radius": 5},
    "glow": {"enabled": true, "intensity": 0.3, "color": [255, 200, 100]},
    "shadow": {"offsetX": 2, "offsetY": 2, "blur": 4, "color": [0, 0, 0, 128]}
  }
}
```

### Global Styles

- **fontFamily** (string): Font family name. Default: "Arial"
- **fontSize** (int): Font size in pixels. Default: 72
- **resolution** (array): [width, height]. Default: [1920, 1080]
- **fps** (int): Frames per second. Default: 60
- **backgroundColor** (array): [R, G, B, A] (0-255). Default: [0, 0, 0, 255]
- **color** (string): Text color (hex, rgb, rgba). Default: "#FFFFFF"
- **letterSpacing** (float): Letter spacing in pixels
- **lineHeight** (float): Line height multiplier
- **fontWeight** (int|string): Font weight (100-900 or "normal", "bold")
- **textAlign** (string): "left", "center", "right"
- **padding** (string|array): Padding (e.g., "0.4em 0.8em")
- **borderRadius** (float): Border radius in pixels

### Animations

#### Selectors

- **word**: Individual words
- **line**: Complete lines
- **segment**: Transcript segments
- **character**: Individual characters (advanced)

#### Keyframe Properties

**Transform:**
- `x` (float): X position offset
- `y` (float): Y position offset
- `scale` (float): Uniform scale
- `scaleX` (float): X-axis scale
- `scaleY` (float): Y-axis scale
- `rotation` (float): Rotation in degrees
- `skewX` (float): X-axis skew
- `skewY` (float): Y-axis skew

**Appearance:**
- `opacity` (float): Opacity (0.0-1.0)
- `color` (string|array): Color value
- `blur` (float): Blur radius
- `brightness` (float): Brightness multiplier

**Text:**
- `fontSize` (int): Font size
- `letterSpacing` (float): Letter spacing
- `lineHeight` (float): Line height
- `fontWeight` (int|string): Font weight

#### Easing Functions

- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInQuartic`, `easeOutQuartic`, `easeInOutQuartic`
- `easeInSine`, `easeOutSine`, `easeInOutSine`
- `easeInExponential`, `easeOutExponential`, `easeInOutExponential`
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic`
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce`
- `easeInBack`, `easeOutBack`, `easeInOutBack`

#### Animation Properties

- **selector** (string): Target selector
- **keyframes** (object): Keyframe definitions (percentage-based)
- **duration** (float): Animation duration in seconds
- **easing** (string): Easing function name
- **delay** (float): Delay before animation starts
- **stagger** (float): Delay between elements

### Effects

#### Blur

```json
{
  "blur": {
    "enabled": true,
    "radius": 5
  }
}
```

- **enabled** (boolean): Enable blur effect
- **radius** (int): Blur radius (0-50)

#### Glow

```json
{
  "glow": {
    "enabled": true,
    "intensity": 0.3,
    "radius": 10,
    "color": [255, 200, 100]
  }
}
```

- **enabled** (boolean): Enable glow effect
- **intensity** (float): Glow intensity (0.0-1.0)
- **radius** (int): Blur radius for glow
- **color** (array): Color tint [R, G, B]

#### Shadow

```json
{
  "shadow": {
    "offsetX": 2,
    "offsetY": 2,
    "blur": 4,
    "color": [0, 0, 0, 128]
  }
}
```

- **offsetX** (float): Horizontal offset
- **offsetY** (float): Vertical offset
- **blur** (float): Shadow blur radius
- **color** (array): Shadow color [R, G, B, A]

## Examples

### Simple Fade In

```json
{
  "animations": [
    {
      "selector": "word",
      "keyframes": {
        "0%": {"opacity": 0},
        "100%": {"opacity": 1}
      },
      "duration": 0.5,
      "easing": "easeIn"
    }
  ]
}
```

### Scale and Bounce

```json
{
  "animations": [
    {
      "selector": "word",
      "keyframes": {
        "0%": {"opacity": 0, "scale": 0.5, "y": 50},
        "50%": {"opacity": 1, "scale": 1.2, "y": -20},
        "100%": {"opacity": 1, "scale": 1.0, "y": 0}
      },
      "duration": 0.8,
      "easing": "easeOutBounce"
    }
  ]
}
```

### Staggered Animation

```json
{
  "animations": [
    {
      "selector": "word",
      "keyframes": {
        "0%": {"opacity": 0, "x": -100},
        "100%": {"opacity": 1, "x": 0}
      },
      "duration": 0.6,
      "easing": "easeOutCubic",
      "stagger": 0.1
    }
  ]
}
```

