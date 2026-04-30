from flask import Blueprint, jsonify, request
from app.middleware.auth import require_auth
from app.middleware.csrf import require_csrf
from app.middleware.rate_limit import rate_limit
import subprocess
import tempfile
import os
import sys
import requests
from config import Config
 
@code_bp.route('/execute', methods=['POST'])
@require_auth
@require_csrf
@rate_limit(max_requests=20, window_seconds=60, key_prefix='code')
def execute_code():
    data = request.get_json(silent=True) or {}
    code = data.get('code', '')
    language = data.get('language', 'python')
    expected_output = data.get('expectedOutput', '').strip()

    if not code:
        return jsonify({'output': '', 'error': 'No code provided', 'matches': False}), 400

    if language != 'python':
        return jsonify({'output': '', 'error': 'Only Python supported', 'matches': False}), 400

    # Security: block dangerous imports locally before forwarding
    blocked = ['import os', 'import sys', 'import subprocess', '__import__', 'open(', 'exec(', 'eval(', 'compile(']
    for b in blocked:
        if b in code:
            return jsonify({'output': '', 'error': f'Security: "{b}" is not allowed in sandbox.', 'matches': False}), 403

    try:
        response = requests.post(
            f"{Config.PYTHON_EXECUTOR_URL}/execute",
            json={'code': code, 'expectedOutput': expected_output},
            timeout=15,
            headers={
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Frontend-Origin': 'EditorCode',
            }
        )
        response.raise_for_status()
        data = response.json()
        output = (data.get('output') or '').strip()
        error = data.get('error', '') or ''
        matches = bool(data.get('matches', False))
        return jsonify({'output': output, 'error': error, 'matches': matches})
    except requests.exceptions.Timeout:
        return jsonify({'output': '', 'error': 'Execution timed out (10s limit)', 'matches': False}), 504
    except requests.exceptions.RequestException as exc:
        return jsonify({'output': '', 'error': f'Execution service unavailable: {exc}', 'matches': False}), 502
 