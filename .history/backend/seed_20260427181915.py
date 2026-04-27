"""
Seed script for CodeMaster Pro
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
 
from pymongo import MongoClient
import bcrypt
from datetime import datetime, timezone, timedelta
from config import Config
 
client = MongoClient(Config.MONGO_URI)
db =client['codemaster']
 
def clear():
    db.users.drop()
    db.courses.drop()
    db.progress.drop()
    print("✓ Cleared existing data")
 
def seed_user():
    # pw = bcrypt.hashpw(b'Password123!', bcrypt.gensalt())
    pw = bcrypt.hashpw("Password123!".encode(), bcrypt.gensalt()).decode('utf-8')
    result = db.users.insert_one({
        'email': 'dev@syntax.io',
        'password_hash': pw,
        'name': 'Tahin Warkash',
        'created_at': datetime.now(timezone.utc),
        'last_login': datetime.now(timezone.utc),
        'is_active': True,
    })
    print(f"✓ Demo user created: dev@syntax.io / Password123!")
    return result.inserted_id
 
def seed_course():
    course = {
        'course_id': 'python-mastery',
        'title': 'Mastery Python',
        'description': 'From fundamental syntax to industrial-grade web architecture. This path transforms your coding logic into architectural excellence.',
        'estimated_hours': 40,
        'modules': [
            {
                'id': 'mod_1',
                'title': 'Basic Syntax',
                'description': 'Master the grammar of Python. Variables, loops, and conditional logic that form the foundation of every program.',
                'order': 1,
                'total_lessons': 8,
                'estimated_minutes': 160,
                'icon': '📝',
                'prerequisite': None,
                'submodules': [
                    {
                        'id': 'sub_1_1',
                        'title': 'The Illuminated Syntax',
                        'description': 'Foundational syntax, types, and idiomatic Python.',
                        'order': 1,
                        'lessons': [
                            {
                                'id': 'les_1_1_1',
                                'title': 'The Pythonic Way',
                                'description': "Python's philosophy emphasizes readability and simplicity. The Zen of Python guides developers to write clean, elegant code that is easy to understand and maintain.",
                                'core_concepts': [
                                    '**Readability counts** — code is read more than written.',
                                    '**Explicit is better than implicit** — avoid magic.',
                                    '**Simple is better than complex** — keep it minimal.',
                                ],
                                'syntax_reference': '# The Pythonic way\nname = "Python"\ngreeting = f"Hello, {name}!"\nprint(greeting)\n\n# List comprehension (Pythonic)\nsquares = [x**2 for x in range(10)]',
                                'lab_challenge': 'Write a function called `greet` that takes a `name` parameter and returns `"Hello, {name}!"`. Call it with `"World"` and print the result.',
                                'starter_code': '# Write a greet function\ndef greet(name):\n    pass\n\n# Call greet with "World"\nprint(greet("World"))',
                                'solution_code': 'def greet(name):\n    return f"Hello, {name}!"\nprint(greet("World"))',
                                'expected_output': 'Hello, World!',
                                'order': 1,
                            },
                            {
                                'id': 'les_1_1_2',
                                'title': 'Types & Dynamic Typing',
                                'description': 'Python uses dynamic typing, meaning variables can hold any type of value. Understanding types is crucial for writing bug-free code.',
                                'core_concepts': [
                                    '**int, float, str, bool** are Python\'s basic types.',
                                    '**type()** returns the type of any value.',
                                    '**Type conversion** allows casting between types.',
                                ],
                                'syntax_reference': 'x = 42          # int\ny = 3.14        # float\nname = "Alice"  # str\nactive = True   # bool\n\nprint(type(x))  # <class "int">',
                                'lab_challenge': 'Create variables for your `age` (integer), `height` (float), and `name` (string). Print each using `type()` to show their types.',
                                'starter_code': '# Create age, height, name variables\nage = None\nheight = None\nname = None\n\nprint(type(age))\nprint(type(height))\nprint(type(name))',
                                'solution_code': 'age = 25\nheight = 5.9\nname = "Alex"\nprint(type(age))\nprint(type(height))\nprint(type(name))',
                                'expected_output': "<class 'int'>\n<class 'float'>\n<class 'str'>",
                                'order': 2,
                            },
                        ]
                    },
                    {
                        'id': 'sub_1_2',
                        'title': 'Control Flow Mastery',
                        'description': 'Conditionals, loops, and branching logic.',
                        'order': 2,
                        'lessons': [
                            {
                                'id': 'les_1_2_1',
                                'title': 'If/Elif/Else Logic',
                                'description': 'Conditional statements allow your program to make decisions. Python uses indentation to define code blocks.',
                                'core_concepts': [
                                    '**if** evaluates a condition — runs if True.',
                                    '**elif** chains multiple conditions.',
                                    '**else** catches everything else.',
                                ],
                                'syntax_reference': 'score = 85\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\n\nprint(f"Grade: {grade}")',
                                'lab_challenge': 'Write a function `classify_number(n)` that returns `"positive"` if n > 0, `"negative"` if n < 0, or `"zero"` if n == 0. Test with `classify_number(-5)`.',
                                'starter_code': 'def classify_number(n):\n    pass\n\nprint(classify_number(-5))',
                                'solution_code': 'def classify_number(n):\n    if n > 0:\n        return "positive"\n    elif n < 0:\n        return "negative"\n    else:\n        return "zero"\nprint(classify_number(-5))',
                                'expected_output': 'negative',
                                'order': 1,
                            },
                            {
                                'id': 'les_1_2_2',
                                'title': 'Loops & Iteration',
                                'description': 'Loops let you execute code multiple times. Python has `for` loops for sequences and `while` loops for conditions.',
                                'core_concepts': [
                                    '**for** loops iterate over any sequence.',
                                    '**range()** generates a sequence of numbers.',
                                    '**while** loops run until a condition is False.',
                                ],
                                'syntax_reference': '# For loop with range\nfor i in range(5):\n    print(i)\n\n# While loop\ncount = 0\nwhile count < 3:\n    print(count)\n    count += 1',
                                'lab_challenge': 'Use a `for` loop with `range()` to print the sum of all numbers from 1 to 10. Print just the final sum.',
                                'starter_code': '# Calculate sum of 1 to 10\ntotal = 0\nfor i in range(1, 11):\n    pass  # Add i to total\n\nprint(total)',
                                'solution_code': 'total = 0\nfor i in range(1, 11):\n    total += i\nprint(total)',
                                'expected_output': '55',
                                'order': 2,
                            },
                        ]
                    },
                    {
                        'id': 'sub_1_3',
                        'title': 'Functions & Scope',
                        'description': 'Writing reusable, modular Python functions.',
                        'order': 3,
                        'lessons': [
                            {
                                'id': 'les_1_3_1',
                                'title': 'Defining Functions',
                                'description': 'Functions are reusable blocks of code that perform a specific task. They promote DRY (Don\'t Repeat Yourself) programming.',
                                'core_concepts': [
                                    '**def** keyword declares a function.',
                                    '**return** sends a value back to the caller.',
                                    '**Parameters** are inputs; **arguments** are actual values passed.',
                                ],
                                'syntax_reference': 'def add(a, b):\n    """Adds two numbers."""\n    return a + b\n\nresult = add(3, 5)\nprint(result)  # 8',
                                'lab_challenge': 'Write a function `multiply(a, b)` that returns the product of two numbers. Print `multiply(6, 7)`.',
                                'starter_code': 'def multiply(a, b):\n    pass\n\nprint(multiply(6, 7))',
                                'solution_code': 'def multiply(a, b):\n    return a * b\nprint(multiply(6, 7))',
                                'expected_output': '42',
                                'order': 1,
                            },
                            {
                                'id': 'les_1_3_2',
                                'title': 'Default & Keyword Args',
                                'description': 'Python supports default parameter values and keyword arguments, making functions more flexible and readable.',
                                'core_concepts': [
                                    '**Default args** provide fallback values.',
                                    '**Keyword args** allow passing by name, improving clarity.',
                                    '***args** and ****kwargs** enable variable argument lists.',
                                ],
                                'syntax_reference': 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Alice"))           # Hello, Alice!\nprint(greet("Bob", "Hi"))       # Hi, Bob!',
                                'lab_challenge': 'Create `power(base, exponent=2)` that returns `base` raised to `exponent`. Print `power(3)` (should be 9) and `power(2, 10)` (should be 1024).',
                                'starter_code': 'def power(base, exponent=2):\n    pass\n\nprint(power(3))\nprint(power(2, 10))',
                                'solution_code': 'def power(base, exponent=2):\n    return base ** exponent\nprint(power(3))\nprint(power(2, 10))',
                                'expected_output': '9\n1024',
                                'order': 2,
                            },
                        ]
                    },
                ]
            },
            {
                'id': 'mod_2',
                'title': 'Data Structures',
                'description': 'Lists, Dictionaries, and Tuples. Learn how to store and manipulate complex data structures for real-world applications.',
                'order': 2,
                'total_lessons': 10,
                'estimated_minutes': 200,
                'icon': '📊',
                'prerequisite': 'Basic Syntax',
                'submodules': [
                    {
                        'id': 'sub_2_1',
                        'title': 'List Comprehensions & Maps',
                        'description': 'Efficient functional programming patterns in Python.',
                        'order': 1,
                        'lessons': [
                            {
                                'id': 'les_2_1_1',
                                'title': 'Mastering Python Lists',
                                'description': "Lists are Python's most versatile compound data type. Used to group together other values, a list is a collection which is ordered and changeable. In Python, lists are written with square brackets.",
                                'core_concepts': [
                                    'Lists are **indexed** starting from zero.',
                                    'They can contain multiple **different data types**.',
                                ],
                                'syntax_reference': '# Creating a list of tech stacks\ntech_stacks = ["React", "Python", "Tailwind"]\n\n# Accessing the second item (index 1)\nprint(tech_stacks[1])  # Output: Python',
                                'lab_challenge': 'Create a list named `fruits` containing three items: `"apple"`, `"banana"`, and `"cherry"`. Then use the `print()` function to output the last item in your list using negative indexing.',
                                'starter_code': '# TODO: Create your list below\nfruits = ["apple", "banana", "cherry"]\n\n# Print the last element using negative indexing\nprint(fruits[-1])',
                                'solution_code': 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[-1])',
                                'expected_output': 'cherry',
                                'order': 1,
                            },
                            {
                                'id': 'les_2_1_2',
                                'title': 'List Methods & Slicing',
                                'description': 'Python lists come with powerful built-in methods for adding, removing, and reorganizing data.',
                                'core_concepts': [
                                    '**append()** adds to the end; **insert()** at a position.',
                                    '**Slicing** [start:stop:step] extracts sublists.',
                                    '**sorted()** returns a new sorted list.',
                                ],
                                'syntax_reference': 'nums = [3, 1, 4, 1, 5, 9]\nnums.append(2)\nprint(nums[:3])    # [3, 1, 4]\nprint(sorted(nums))',
                                'lab_challenge': 'Create a list `[5, 3, 8, 1, 9, 2]`, sort it, and print the sorted list.',
                                'starter_code': 'nums = [5, 3, 8, 1, 9, 2]\n# Sort and print\nprint(sorted(nums))',
                                'solution_code': 'nums = [5, 3, 8, 1, 9, 2]\nprint(sorted(nums))',
                                'expected_output': '[1, 2, 3, 5, 8, 9]',
                                'order': 2,
                            },
                        ]
                    },
                    {
                        'id': 'sub_2_2',
                        'title': 'Object Oriented Design',
                        'description': 'Classes, inheritance, and polymorphism in Python.',
                        'order': 2,
                        'lessons': [
                            {
                                'id': 'les_2_2_1',
                                'title': 'Classes & Objects',
                                'description': 'Object-oriented programming organizes code around objects that combine data (attributes) and behavior (methods).',
                                'core_concepts': [
                                    '**class** defines a blueprint for objects.',
                                    '**__init__** is the constructor method.',
                                    '**self** refers to the current instance.',
                                ],
                                'syntax_reference': 'class Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n\n    def bark(self):\n        return f"{self.name} says Woof!"\n\ndog = Dog("Rex", "Labrador")\nprint(dog.bark())',
                                'lab_challenge': 'Create a `Circle` class with `radius` attribute. Add a `area()` method that returns `3.14159 * radius ** 2`. Print `Circle(5).area()`.',
                                'starter_code': 'class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n\n    def area(self):\n        pass\n\nprint(Circle(5).area())',
                                'solution_code': 'class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n    def area(self):\n        return 3.14159 * self.radius ** 2\nprint(Circle(5).area())',
                                'expected_output': '78.53975',
                                'order': 1,
                            },
                            {
                                'id': 'les_2_2_2',
                                'title': 'Mid Module Challenge',
                                'description': 'Consolidate your data structures knowledge with a practical challenge.',
                                'core_concepts': [
                                    'Combine lists, dicts, and classes effectively.',
                                    'Think about **data modeling** before coding.',
                                ],
                                'syntax_reference': '# Dictionary example\nstudent = {"name": "Alice", "grades": [90, 85, 92]}\navg = sum(student["grades"]) / len(student["grades"])\nprint(f"{student[\'name\']}: {avg:.1f}")',
                                'lab_challenge': 'Create a dict with `"name": "Python"` and `"version": 3`. Print the name.',
                                'starter_code': 'lang = {"name": "Python", "version": 3}\nprint(lang["name"])',
                                'solution_code': 'lang = {"name": "Python", "version": 3}\nprint(lang["name"])',
                                'expected_output': 'Python',
                                'order': 2,
                            },
                        ]
                    },
                ]
            },
            {
                'id': 'mod_3',
                'title': 'Web with Django',
                'description': 'Build robust web applications using the most popular Python framework. REST APIs and database integration.',
                'order': 3,
                'total_lessons': 12,
                'estimated_minutes': 320,
                'icon': '🌐',
                'prerequisite': 'Data Structure Completion',
                'submodules': [
                    {
                        'id': 'sub_3_1',
                        'title': 'The MVC Architecture',
                        'description': 'Models, Views, and Controllers in Django.',
                        'order': 1,
                        'lessons': [
                            {
                                'id': 'les_3_1_1',
                                'title': 'Django Setup & Hello World',
                                'description': 'Setting up your first Django project and understanding its structure.',
                                'core_concepts': [
                                    '**django-admin startproject** creates a project.',
                                    '**Apps** are modular components of a Django project.',
                                    '**settings.py** configures your entire application.',
                                ],
                                'syntax_reference': '# views.py\nfrom django.http import HttpResponse\n\ndef hello(request):\n    return HttpResponse("Hello, Django!")',
                                'lab_challenge': 'Print `"Django is awesome!"` to demonstrate your Django knowledge.',
                                'starter_code': 'print("Django is awesome!")',
                                'solution_code': 'print("Django is awesome!")',
                                'expected_output': 'Django is awesome!',
                                'order': 1,
                            },
                        ]
                    },
                ]
            },
            {
                'id': 'mod_4',
                'title': 'Advanced Analytics',
                'description': 'NumPy, Pandas, and data visualization techniques for data science and machine learning pipelines.',
                'order': 4,
                'total_lessons': 12,
                'estimated_minutes': 320,
                'icon': '📈',
                'prerequisite': 'Web with Django Completion',
                'submodules': [
                    {
                        'id': 'sub_4_1',
                        'title': 'NumPy Foundations',
                        'description': 'Array computing and mathematical operations.',
                        'order': 1,
                        'lessons': [
                            {
                                'id': 'les_4_1_1',
                                'title': 'NumPy Arrays',
                                'description': 'NumPy provides fast, memory-efficient arrays for numerical computing.',
                                'core_concepts': [
                                    '**np.array()** creates arrays from lists.',
                                    'Arrays support **vectorized operations**.',
                                    '**shape** and **dtype** describe array structure.',
                                ],
                                'syntax_reference': 'import numpy as np\narr = np.array([1, 2, 3, 4, 5])\nprint(arr * 2)',
                                'lab_challenge': 'Print the string `"NumPy ready!"` to start your data science journey.',
                                'starter_code': 'print("NumPy ready!")',
                                'solution_code': 'print("NumPy ready!")',
                                'expected_output': 'NumPy ready!',
                                'order': 1,
                            },
                        ]
                    },
                ]
            },
        ]
    }
    result = db.courses.insert_one(course)
    print(f"✓ Course seeded: Python Mastery ({result.inserted_id})")
    return result.inserted_id
 
def seed_progress(user_id):
    """Seed progress: mod1 completed, mod2 60%, mod3 in_progress, mod4 locked"""
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
 
    progress = {
        'user_id': user_id,
        'course_id': 'python-mastery',
        'modules': [
            {
                'id': 'mod_1',
                'title': 'Basic Syntax',
                'status': 'completed',
                'order': 1,
                'submodules': [
                    {
                        'id': 'sub_1_1',
                        'title': 'The Illuminated Syntax',
                        'status': 'completed',
                        'order': 1,
                        'lessons': [
                            {'id': 'les_1_1_1', 'title': 'The Pythonic Way', 'status': 'completed', 'time_spent_seconds': 540, 'completed_at': yesterday.isoformat()},
                            {'id': 'les_1_1_2', 'title': 'Types & Dynamic Typing', 'status': 'completed', 'time_spent_seconds': 420, 'completed_at': yesterday.isoformat()},
                        ]
                    },
                    {
                        'id': 'sub_1_2',
                        'title': 'Control Flow Mastery',
                        'status': 'completed',
                        'order': 2,
                        'lessons': [
                            {'id': 'les_1_2_1', 'title': 'If/Elif/Else Logic', 'status': 'completed', 'time_spent_seconds': 380, 'completed_at': yesterday.isoformat()},
                            {'id': 'les_1_2_2', 'title': 'Loops & Iteration', 'status': 'completed', 'time_spent_seconds': 460, 'completed_at': yesterday.isoformat()},
                        ]
                    },
                    {
                        'id': 'sub_1_3',
                        'title': 'Functions & Scope',
                        'status': 'completed',
                        'order': 3,
                        'lessons': [
                            {'id': 'les_1_3_1', 'title': 'Defining Functions', 'status': 'completed', 'time_spent_seconds': 520, 'completed_at': yesterday.isoformat()},
                            {'id': 'les_1_3_2', 'title': 'Default & Keyword Args', 'status': 'completed', 'time_spent_seconds': 490, 'completed_at': yesterday.isoformat()},
                        ]
                    },
                ]
            },
            {
                'id': 'mod_2',
                'title': 'Data Structures',
                'status': 'in_progress',
                'order': 2,
                'submodules': [
                    {
                        'id': 'sub_2_1',
                        'title': 'List Comprehensions & Maps',
                        'status': 'completed',
                        'order': 1,
                        'lessons': [
                            {'id': 'les_2_1_1', 'title': 'Mastering Python Lists', 'status': 'completed', 'time_spent_seconds': 650, 'completed_at': now.isoformat()},
                            {'id': 'les_2_1_2', 'title': 'List Methods & Slicing', 'status': 'completed', 'time_spent_seconds': 480, 'completed_at': now.isoformat()},
                        ]
                    },
                    {
                        'id': 'sub_2_2',
                        'title': 'Object Oriented Design',
                        'status': 'in_progress',
                        'order': 2,
                        'lessons': [
                            {'id': 'les_2_2_1', 'title': 'Classes & Objects', 'status': 'in_progress', 'time_spent_seconds': 120, 'completed_at': None},
                            {'id': 'les_2_2_2', 'title': 'Mid Module Challenge', 'status': 'not_started', 'time_spent_seconds': 0, 'completed_at': None},
                        ]
                    },
                ]
            },
            {
                'id': 'mod_3',
                'title': 'Web with Django',
                'status': 'in_progress',
                'order': 3,
                'submodules': [
                    {
                        'id': 'sub_3_1',
                        'title': 'The MVC Architecture',
                        'status': 'in_progress',
                        'order': 1,
                        'lessons': [
                            {'id': 'les_3_1_1', 'title': 'Django Setup & Hello World', 'status': 'not_started', 'time_spent_seconds': 0, 'completed_at': None},
                        ]
                    },
                ]
            },
            {
                'id': 'mod_4',
                'title': 'Advanced Analytics',
                'status': 'locked',
                'order': 4,
                'submodules': [
                    {
                        'id': 'sub_4_1',
                        'title': 'NumPy Foundations',
                        'status': 'not_started',
                        'order': 1,
                        'lessons': [
                            {'id': 'les_4_1_1', 'title': 'NumPy Arrays', 'status': 'not_started', 'time_spent_seconds': 0, 'completed_at': None},
                        ]
                    },
                ]
            },
        ],
        'total_progress_percent': 35,
        'time_spent_minutes': 125,
        'streak_days': 3,
        'last_active_date': now,
        'created_at': now - timedelta(days=7),
        'updated_at': now,
    }
    result = db.progress.insert_one(progress)
    print(f"✓ Progress seeded: Module 1 completed, Module 2 in progress (60%), Module 4 locked")
    return result.inserted_id
 
if __name__ == '__main__':
    print("\n🌱 Seeding CodeMaster Pro database...\n")
    clear()
    user_id = seed_user()
    seed_course()
    seed_progress(user_id)
    print("\n✅ Seed complete! Login with: dev@syntax.io / Password123!\n")
