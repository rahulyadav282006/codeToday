from flask import Blueprint, jsonify, request
from app.middleware.auth import require_auth
import app as app_module
 
courses_bp = Blueprint('courses', __name__)
 
@courses_bp.route('/', methods=['GET'])
def get_courses():
    courses = list(app_module.db.courses.find({}, {'modules.submodules.lessons.starter_code': 0, 'modules.submodules.lessons.solution_code': 0}))
    for c in courses:
        c['_id'] = str(c['_id'])
    return jsonify(courses)
 
@courses_bp.route('/<course_id>', methods=['GET'])
def get_course(course_id):
    course = app_module.db.courses.find_one({'course_id': course_id}, {'modules.submodules.lessons.starter_code': 0, 'modules.submodules.lessons.solution_code': 0})
    if not course:
        return jsonify({'message': 'Course not found'}), 404
    course['_id'] = str(course['_id'])
    return jsonify(course)
 
@courses_bp.route('/<course_id>/modules', methods=['GET'])
@require_auth
def get_modules(course_id):
    course = app_module.db.courses.find_one({'course_id': course_id})
    if not course:
        return jsonify({'message': 'Course not found'}), 404
    modules = []
    for m in course.get('modules', []):
        modules.append({
            'id': m['id'],
            'title': m['title'],
            'description': m['description'],
            'order': m['order'],
            'total_lessons': m.get('total_lessons', 0),
            'estimated_minutes': m.get('estimated_minutes', 0),
        })
    return jsonify(modules)
 
@courses_bp.route('/<course_id>/modules/<module_id>', methods=['GET'])
@require_auth
def get_module(course_id, module_id):
    course = app_module.db.courses.find_one({'course_id': course_id})
    if not course:
        return jsonify({'message': 'Course not found'}), 404
    for m in course.get('modules', []):
        if m['id'] == module_id:
            # Don't expose solution code
            result = dict(m)
            for sub in result.get('submodules', []):
                for les in sub.get('lessons', []):
                    les.pop('solution_code', None)
            return jsonify(result)
    return jsonify({'message': 'Module not found'}), 404
 
@courses_bp.route('/lessons/<lesson_id>', methods=['GET'])
@require_auth
def get_lesson(lesson_id):
    course = app_module.db.courses.find_one({'modules.submodules.lessons.id': lesson_id})
    if not course:
        return jsonify({'message': 'Lesson not found'}), 404
    for m in course.get('modules', []):
        for sub in m.get('submodules', []):
            for les in sub.get('lessons', []):
                if les['id'] == lesson_id:
                    result = dict(les)
                    result.pop('solution_code', None)
                    result['submodule_id'] = sub['id']
                    result['module_id'] = m['id']
                    return jsonify(result)
    return jsonify({'message': 'Lesson not found'}), 404