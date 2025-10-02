import json
import subprocess
import textwrap
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def _restore_special_numbers(value):
    if isinstance(value, str):
        if value == 'Infinity':
            return float('inf')
        if value == '-Infinity':
            return float('-inf')
        if value == 'NaN':
            return float('nan')
        return value
    if isinstance(value, list):
        return [_restore_special_numbers(item) for item in value]
    if isinstance(value, dict):
        return {key: _restore_special_numbers(val) for key, val in value.items()}
    return value


def run_js_expression(expression, imports=None, prelude=""):
    """Evaluate an expression in a Node.js ESM context and return JSON output."""
    imports = imports or []
    import_section = "\n".join(imports)
    script = textwrap.dedent(
        f"""
        {import_section}
        {prelude}
        const __value__ = ({expression});
        const replacer = (_key, val) => {{
          if (typeof val === 'number') {{
            if (Number.isNaN(val)) return 'NaN';
            if (val === Infinity) return 'Infinity';
            if (val === -Infinity) return '-Infinity';
          }}
          return val;
        }};
        if (typeof __value__ === 'undefined') {{
          console.log('null');
        }} else {{
          console.log(JSON.stringify(__value__, replacer));
        }}
        """
    )
    completed = subprocess.run(
        ['node', '--input-type=module', '-e', script],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    output = completed.stdout.strip()
    if output == 'null' or output == '':
        return None
    data = json.loads(output)
    return _restore_special_numbers(data)


def run_js_expect_error(body, imports=None, prelude=""):
    """Execute statements expecting Node to exit with a non-zero status."""
    imports = imports or []
    import_section = "\n".join(imports)
    script = textwrap.dedent(
        f"""
        {import_section}
        {prelude}
        {body}
        """
    )
    completed = subprocess.run(
        ['node', '--input-type=module', '-e', script],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert completed.returncode != 0, 'Expected command to fail'
    return completed
