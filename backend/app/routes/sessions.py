"""
Session management endpoints for cross-device logout and device tracking.
Allows users to see active sessions and logout from specific or all devices.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timezone
from app.middleware.auth import require_auth
from app.middleware.csrf import require_csrf
import app as m

sessions_bp = Blueprint('sessions', __name__)


def _now():
    return datetime.now(timezone.utc)


@sessions_bp.route('/active', methods=['GET'])
@require_auth
def get_active_sessions():
    """
    Get list of active sessions for the current user.
    
    Returns:
        [
            {
                "device_id": "uuid-string",
                "device_name": "Chrome on Windows",
                "last_seen": "2026-04-30T12:00:00Z",
                "ip": "192.168.1.1",
                "is_current": true,  # if same device_id as request
                "created_at": "2026-04-30T10:00:00Z"
            }
        ]
    """
    try:
        user = m.db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        sessions = user.get('active_sessions', [])
        current_device_id = request.headers.get('X-Device-ID', '')
        
        # Add is_current flag
        for session in sessions:
            session['is_current'] = session['device_id'] == current_device_id
        
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching sessions: {str(e)}'}), 500


@sessions_bp.route('/logout', methods=['POST'])
@require_auth
@require_csrf
def logout_session():
    """
    Logout from a specific device or all devices.
    
    Query params:
        device_id (optional): If provided, logout only that device. If missing, logout all except current.
    
    Body:
        {
            "logout_all": true/false  # If true, logout from ALL devices including current
        }
    """
    try:
        device_id = request.args.get('device_id')
        data = request.get_json(silent=True) or {}
        logout_all = data.get('logout_all', False)
        current_device_id = request.headers.get('X-Device-ID', '')
        
        user = m.db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        sessions = user.get('active_sessions', [])
        
        if logout_all:
            # Remove ALL sessions
            new_sessions = []
            message = "Logged out from all devices"
        elif device_id:
            # Remove specific device
            new_sessions = [s for s in sessions if s['device_id'] != device_id]
            message = f"Logged out from device {device_id}"
        else:
            # Remove all except current
            new_sessions = [s for s in sessions if s['device_id'] == current_device_id]
            message = "Logged out from all other devices"
        
        # Update user document
        m.db.users.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$set': {
                'active_sessions': new_sessions,
                'updated_at': _now()
            }}
        )
        
        # Blacklist current token if logout_all or this device
        if logout_all or device_id == current_device_id or not device_id:
            token = (request.headers.get('Authorization', '') or '')[7:]
            if m.cache:
                try:
                    from config import Config
                    m.cache.set(f'bl:{token}', '1', Config.ACCESS_TOKEN_EXPIRES)
                except Exception:
                    pass
        
        return jsonify({'message': message}), 200
    except Exception as e:
        return jsonify({'message': f'Error logging out: {str(e)}'}), 500


@sessions_bp.route('/remember', methods=['POST'])
@require_auth
@require_csrf
def remember_device():
    """
    Mark current device as "remember me" device for auto-login.
    
    Body:
        {
            "device_id": "uuid-string",
            "device_name": "Chrome on Windows"  # optional, auto-generated if not provided
        }
    
    Returns: 201 Created
    """
    try:
        data = request.get_json(silent=True) or {}
        device_id = data.get('device_id') or request.headers.get('X-Device-ID', '')
        device_name = data.get('device_name', 'Unknown Device')
        
        if not device_id:
            return jsonify({'message': 'Device ID required'}), 400
        
        user = m.db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Add or update in remember_me_devices list
        remember_devices = user.get('remember_me_devices', [])
        
        # Check if device already in list
        existing = next((d for d in remember_devices if d['device_id'] == device_id), None)
        if existing:
            existing['updated_at'] = _now()
        else:
            remember_devices.append({
                'device_id': device_id,
                'device_name': device_name,
                'created_at': _now(),
                'updated_at': _now()
            })
        
        m.db.users.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$set': {'remember_me_devices': remember_devices}}
        )
        
        return jsonify({
            'message': 'Device remembered',
            'device_id': device_id,
            'device_name': device_name
        }), 201
    except Exception as e:
        return jsonify({'message': f'Error remembering device: {str(e)}'}), 500


@sessions_bp.route('/forget', methods=['POST'])
@require_auth
@require_csrf
def forget_device():
    """
    Remove device from "remember me" list.
    
    Body:
        {
            "device_id": "uuid-string"
        }
    """
    try:
        data = request.get_json(silent=True) or {}
        device_id = data.get('device_id')
        
        if not device_id:
            return jsonify({'message': 'Device ID required'}), 400
        
        user = m.db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        remember_devices = user.get('remember_me_devices', [])
        new_devices = [d for d in remember_devices if d['device_id'] != device_id]
        
        m.db.users.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$set': {'remember_me_devices': new_devices}}
        )
        
        return jsonify({'message': 'Device forgotten'}), 200
    except Exception as e:
        return jsonify({'message': f'Error forgetting device: {str(e)}'}), 500
