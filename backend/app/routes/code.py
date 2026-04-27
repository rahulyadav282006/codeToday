from flask import Blueprint, jsonify, request
from app.middleware.auth import require_auth
import subprocess
import tempfile
import os
import sys
 
code_bp = Blueprint('code', __name__)
 
@code_bp.route('/execute', methods=['POST'])
@require_auth
def execute_code():
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    expected_output = data.get('expectedOutput', '').strip()
 
    if not code:
        return jsonify({'output': '', 'error': 'No code provided', 'matches': False}), 400
 
    if language != 'python':
        return jsonify({'output': '', 'error': 'Only Python supported', 'matches': False}), 400
 
    # Security: block dangerous imports
    blocked = ['import os', 'import sys', 'import subprocess', '__import__', 'open(', 'exec(', 'eval(', 'compile(']
    for b in blocked:
        if b in code:
            return jsonify({'output': '', 'error': f'Security: "{b}" is not allowed in sandbox.', 'matches': False}), 403
 
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            tmp_path = f.name
 
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True, text=True, timeout=10,
            cwd=tempfile.gettempdir()
        )
        os.unlink(tmp_path)
 
        output = result.stdout.strip()
        error = result.stderr.strip()
        matches = (output == expected_output) if expected_output else False
 
        return jsonify({'output': output, 'error': error, 'matches': matches})
 
    except subprocess.TimeoutExpired:
        return jsonify({'output': '', 'error': 'Execution timed out (10s limit)', 'matches': False})
    except Exception as e:
        return jsonify({'output': '', 'error': str(e), 'matches': False}), 500
 