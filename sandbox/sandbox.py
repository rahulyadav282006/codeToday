"""
Secure Python code sandbox server.
Runs untrusted Python code in a restricted environment.
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import tempfile
import os
import sys
import signal
# import resource
 
BLOCKED_IMPORTS = [
    'os', 'sys', 'subprocess', 'socket', 'urllib', 'http',
    'ftplib', 'smtplib', 'telnetlib', 'shutil', 'glob',
    'pathlib', 'importlib', '__import__',
]
 
def is_safe_code(code):
    for b in BLOCKED_IMPORTS:
        if f'import {b}' in code or f'from {b}' in code:
            return False, f'Import "{b}" is not allowed in sandbox.'
    if 'open(' in code and '__builtins__' not in code:
        return False, 'File operations are not allowed in sandbox.'
    if 'exec(' in code or 'eval(' in code or 'compile(' in code:
        return False, 'exec/eval/compile are not allowed.'
    return True, None
 
def run_code(code, timeout=10):
    safe, reason = is_safe_code(code)
    if not safe:
        return '', reason, False
 
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
        f.write(code)
        path = f.name
 
    try:
        proc = subprocess.run(
            [sys.executable, path],
            capture_output=True, text=True,
            timeout=timeout,
            cwd='/tmp',
            env={'PATH': '/usr/local/bin:/usr/bin:/bin', 'HOME': '/tmp'},
        )
        return proc.stdout.strip(), proc.stderr.strip(), True
    except subprocess.TimeoutExpired:
        return '', f'Execution timed out ({timeout}s limit)', False
    except Exception as e:
        return '', str(e), False
    finally:
        try:
            os.unlink(path)
        except:
            pass
 
class SandboxHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/execute':
            self.send_response(404)
            self.end_headers()
            return
 
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
 
        try:
            data = json.loads(body)
            code = data.get('code', '')
            expected = data.get('expectedOutput', '').strip()
 
            stdout, stderr, ok = run_code(code)
            matches = (stdout == expected) if expected else False
 
            response = json.dumps({
                'output': stdout,
                'error': stderr,
                'matches': matches,
            })
 
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.encode())
 
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "Invalid JSON"}')
 
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
 
    def log_message(self, format, *args):
        pass  # Suppress logs
 
if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), SandboxHandler)
    print('Sandbox server running on :8080')
    server.serve_forever()
 