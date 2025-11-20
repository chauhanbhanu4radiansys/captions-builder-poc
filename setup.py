"""Setup script for motion typography engine."""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

setup(
    name="motion-typography-engine",
    version="1.0.0",
    description="GPU-accelerated motion typography video renderer",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Motion Typography Team",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "numpy>=1.24.0",
        "torch>=2.0.0",
        "skia-python>=87.5",
        "Pillow>=10.0.0",
        "opencv-python>=4.8.0",
        "ffmpeg-python>=0.2.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        "tqdm>=4.65.0",
        "loguru>=0.7.0",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)

