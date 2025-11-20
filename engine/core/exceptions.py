"""Custom exceptions for the motion typography engine."""


class MotionTypographyError(Exception):
    """Base exception for all motion typography errors."""

    pass


class DSLParseError(MotionTypographyError):
    """Raised when DSL parsing fails."""

    pass


class ValidationError(MotionTypographyError):
    """Raised when validation fails."""

    pass


class RenderError(MotionTypographyError):
    """Raised when rendering fails."""

    pass


class GPUError(MotionTypographyError):
    """Raised when GPU operations fail."""

    pass


class EncodingError(MotionTypographyError):
    """Raised when video encoding fails."""

    pass


class FontError(MotionTypographyError):
    """Raised when font operations fail."""

    pass


class TimelineError(MotionTypographyError):
    """Raised when timeline compilation fails."""

    pass

