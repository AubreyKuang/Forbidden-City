#!/usr/bin/env python3
"""Build the 易次元 (万象笺「包体上传」) package: the full game, cloud saves through the
platform SDK, the platform's own exit button. Same pipeline and options as build-xhs.py:

    python3 scripts/build-yiciyuan.py --tools /path/to/tools --version 1.0.0
        # dist/yiciyuan/chengongji-yiciyuan-V1.0.0.zip
"""
import runpy, sys
from pathlib import Path

sys.argv[1:1] = ['--target', 'yiciyuan']
runpy.run_path(str(Path(__file__).with_name('build-xhs.py')), run_name='__main__')
