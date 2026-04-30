from flask import Blueprint, jsonify, request
from bson import ObjectId
from datetime import datetime, timezone, date
from app.middleware.auth import require_auth
from app.middleware.csrf import require_csrf
from app.middleware.rate_limit import rate_limit
import app as app_module
 
progress_bp = Blueprint('progress', __name__)
 
def recalculate_progress(progress_doc):
    """Recalculate total_progress_percent from module statuses"""
    modules = progress_doc.get('modules', [])
    if not modules:
        return 0
    completed = sum(1 for m in modules if m['status'] == 'completed')
    return round((completed / len(modules)) * 100)
 
def update_streak(progress_doc):
    today = date.today()
    last_active = progress_doc.get('last_active_date')
    streak = progress_doc.get('streak_days', 0)
 
    if last_active:
        if isinstance(last_active, datetime):
            last_date = last_active.date()
        else:
            last_date = last_active
 
        delta = (today - last_date).days
        if delta == 1:
            streak += 1
        elif delta == 0:
            pass  # Same day, no change
        else:
            streak = 1
    else:
        streak = 1
 
    return streak, datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
 
def init_progress_for_user(user_id, course_id):
    """Initialize progress document from course data"""
    course = app_module.db.courses.find_one({'course_id': course_id})
    if not course:
        return None
 
    modules = []
    for i, m in enumerate(course.get('modules', [])):
        subs = []
        for sub in m.get('submodules', []):
            lessons = [{'id': l['id'], 'title': l['title'], 'status': 'not_started', 'time_spent_seconds': 0, 'completed_at': None}
                       for l in sub.get('lessons', [])]
            subs.append({'id': sub['id'], 'title': sub['title'], 'status': 'not_started', 'order': sub.get('order', i+1), 'lessons': lessons})
        modules.append({
            'id': m['id'],
            'title': m['title'],
            'status': 'unlocked' if i == 0 else 'locked',
            'order': m['order'],
            'submodules': subs,
        })
 
    now = datetime.now(timezone.utc)
    doc = {
        'user_id': ObjectId(user_id),
        'course_id': course_id,
        'modules': modules,
        'total_progress_percent': 0,
        'time_spent_minutes': 0,
        'streak_days': 0,
        'last_active_date': None,
        'created_at': now,
        'updated_at': now,
    }
    result = app_module.db.progress.insert_one(doc)
    doc['_id'] = result.inserted_id
    return doc
 
def serialize_progress(doc):
    if not doc:
        return None
    d = dict(doc)
    d['_id'] = str(d['_id'])
    d['user_id'] = str(d['user_id'])
    return d
 
@progress_bp.route('/<user_id>/<course_id>', methods=['GET'])
@require_auth
@rate_limit(max_requests=100, window_seconds=3600, key_prefix='api')
def get_progress(user_id, course_id):
    progress = app_module.db.progress.find_one({'user_id': ObjectId(user_id), 'course_id': course_id})
    if not progress:
        progress = init_progress_for_user(user_id, course_id)
    return jsonify(serialize_progress(progress))
 
@progress_bp.route('/lesson/complete', methods=['POST'])
@require_auth
@require_csrf
@rate_limit(max_requests=100, window_seconds=3600, key_prefix='api')
def complete_lesson():
    data = request.get_json()
    user_id = data.get('userId')
    course_id = data.get('courseId')
    module_id = data.get('moduleId')
    submodule_id = data.get('submoduleId')
    lesson_id = data.get('lessonId')
    time_spent = data.get('timeSpentSeconds', 0)
 
    progress = app_module.db.progress.find_one({'user_id': ObjectId(user_id), 'course_id': course_id})
    if not progress:
        progress = init_progress_for_user(user_id, course_id)
 
    now = datetime.now(timezone.utc)
    modules = progress['modules']
 
    # Find and update lesson
    for mod in modules:
        if mod['id'] == module_id:
            if mod['status'] == 'locked':
                return jsonify({'message': 'Module is locked'}), 403
            if mod['status'] == 'unlocked':
                mod['status'] = 'in_progress'
 
            for sub in mod.get('submodules', []):
                if sub['id'] == submodule_id:
                    for les in sub.get('lessons', []):
                        if les['id'] == lesson_id:
                            les['status'] = 'completed'
                            les['completed_at'] = now.isoformat()
                            les['time_spent_seconds'] = time_spent
 
                    # Check submodule completion
                    all_les_done = all(l['status'] == 'completed' for l in sub.get('lessons', []))
                    if all_les_done:
                        sub['status'] = 'completed'
 
            # Check module completion
            all_subs_done = all(s['status'] == 'completed' for s in mod.get('submodules', []))
            if all_subs_done:
                mod['status'] = 'completed'
                # Unlock next module
                for next_mod in modules:
                    if next_mod['order'] == mod['order'] + 1 and next_mod['status'] == 'locked':
                        next_mod['status'] = 'unlocked'
                        break
            break
 
    # Recalculate
    total_pct = recalculate_progress({'modules': modules})
    streak, last_active = update_streak(progress)
    time_spent_minutes = progress.get('time_spent_minutes', 0) + round(time_spent / 60, 2)
 
    app_module.db.progress.update_one(
        {'user_id': ObjectId(user_id), 'course_id': course_id},
        {'$set': {
            'modules': modules,
            'total_progress_percent': total_pct,
            'time_spent_minutes': time_spent_minutes,
            'streak_days': streak,
            'last_active_date': last_active,
            'updated_at': now,
        }}
    )
 
    updated = app_module.db.progress.find_one({'user_id': ObjectId(user_id), 'course_id': course_id})
    return jsonify({'progress': serialize_progress(updated), 'message': 'Lesson completed'})
 
@progress_bp.route('/submodule/<submodule_id>/status', methods=['GET'])
@require_auth
@rate_limit(max_requests=100, window_seconds=3600, key_prefix='api')
def get_submodule_status(submodule_id):
    user_id = request.args.get('userId') or request.user_id
    course_id = request.args.get('courseId', 'python-mastery')
    module_id = request.args.get('moduleId')
 
    progress = app_module.db.progress.find_one({'user_id': ObjectId(user_id), 'course_id': course_id})
    if not progress:
        return jsonify({'submodules': []})
 
    for mod in progress.get('modules', []):
        for sub in mod.get('submodules', []):
            if sub['id'] == submodule_id:
                return jsonify(sub)
 
    # Return module submodules if no specific submodule match
    if module_id:
        for mod in progress.get('modules', []):
            if mod['id'] == module_id:
                return jsonify({'submodules': mod.get('submodules', [])})
 
    return jsonify({'submodules': []})
 
@progress_bp.route('/heartbeat', methods=['POST'])
@require_auth
@require_csrf
@rate_limit(max_requests=100, window_seconds=3600, key_prefix='api')
def heartbeat():
    data = request.get_json()
    user_id = data.get('userId')
    course_id = data.get('courseId', 'python-mastery')
    elapsed = data.get('elapsedSeconds', 0)
 
    if user_id and elapsed > 0:
        app_module.db.progress.update_one(
            {'user_id': ObjectId(user_id), 'course_id': course_id},
            {'$inc': {'time_spent_minutes': round(elapsed / 60, 3)},
             '$set': {'updated_at': datetime.now(timezone.utc)}}
        )
    return jsonify({'ok': True})
 
@progress_bp.route('/streak/<user_id>', methods=['GET'])
@require_auth
@rate_limit(max_requests=100, window_seconds=3600, key_prefix='api')
def get_streak(user_id):
    progress = app_module.db.progress.find_one({'user_id': ObjectId(user_id)})
    if not progress:
        return jsonify({'streak_days': 0, 'time_spent_minutes': 0})
    return jsonify({
        'streak_days': progress.get('streak_days', 0),
        'time_spent_minutes': progress.get('time_spent_minutes', 0),
    })