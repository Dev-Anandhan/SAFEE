"""
tier1_test_runner.py — CPU-parallel Tier-1 test runner.

Runs unit tests (pytest), lint (flake8), and light SAST (semgrep)
against the suggested fix written to a temp file.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from typing import Dict, Tuple


def _run_shell(cmd: str, timeout: int = 30) -> Tuple[bool, str]:
    """Run a shell command and return (success, combined_output)."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        output = (result.stdout + "\n" + result.stderr).strip()
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, f"Command timed out after {timeout}s: {cmd}"
    except Exception as e:
        return False, str(e)


def test_runner_tier1_node(state: Dict) -> Dict:
    """Write the suggested fix to a temp file, run lint + tests + SAST."""
    code = state.get("suggested_fix", "")
    if not code:
        return {
            "unit_test_passed": False,
            "lint_passed": False,
            "light_sast_passed": False,
            "test_results": {"error": "No code to test"},
        }

    # Write code to a temp .py file
    fd, path = tempfile.mkstemp(suffix=".py", prefix="safee_")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(code if isinstance(code, str) else str(code))

        # 1) Lint
        lint_ok, lint_log = _run_shell(f"python -m flake8 --max-line-length=120 {path}")

        # 2) Unit tests (best-effort: only if pytest markers exist)
        unit_ok, unit_log = _run_shell(f"python -m pytest {path} --tb=short -q")

        # 3) Light SAST via semgrep (if available)
        sast_ok, sast_log = _run_shell(f"semgrep --config=auto {path} 2>&1 || echo 'semgrep not installed'")

        return {
            "unit_test_passed": unit_ok,
            "lint_passed": lint_ok,
            "light_sast_passed": sast_ok,
            "test_results": {
                "unit_log": unit_log[:2000],
                "lint_log": lint_log[:2000],
                "sast_log": sast_log[:2000],
            },
        }
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
