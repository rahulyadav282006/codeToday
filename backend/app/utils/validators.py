import re
 
def validate_email(email):
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email))
 
def validate_password(password):
    if len(password) < 8:
        return False, 'Password must be at least 8 characters'
    return True, None
 
def validate_name(name):
    if not name or len(name.strip()) < 2:
        return False, 'Name must be at least 2 characters'
    return True, None
 