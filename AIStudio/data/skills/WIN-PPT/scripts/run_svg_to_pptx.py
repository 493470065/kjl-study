#!/usr/bin/env python3
"""Wrapper script to run svg_to_pptx with correct PYTHONPATH."""

import sys
import os
from pathlib import Path

# Add lib directory to path for dependencies
lib_path = Path(__file__).resolve().parent.parent / 'lib'
sys.path.insert(0, str(lib_path))

# Ensure the scripts directory is on sys.path so the package can be found
scripts_path = Path(__file__).resolve().parent
sys.path.insert(0, str(scripts_path))

from svg_to_pptx import main

if __name__ == '__main__':
    main()