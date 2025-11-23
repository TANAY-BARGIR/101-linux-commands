---
title: 'Modules and Packages'
description: 'Learn how to organize your code into reusable modules and packages'
order: 6
---

As your Python projects grow, you'll need ways to organize your code into manageable, reusable components. Python's modules and packages system helps you achieve this by allowing you to break your code into separate files and directories.

## Modules

A module is simply a Python file (with a `.py` extension) containing Python definitions and statements. The module name is the file name without the extension.

### Using Built-in Modules

Python comes with a rich standard library of modules. Let's see how to use them:

```python
# Import the entire module
import math

# Now we can use functions from the math module
print(math.sqrt(16))  # 4.0
print(math.pi)        # 3.141592653589793

# Import specific items from a module
from random import randint, choice

# Now we can use these functions directly
print(randint(1, 10))       # Random integer between 1 and 10
fruits = ['apple', 'banana', 'cherry']
print(choice(fruits))       # Random item from the list

# Import a module with an alias
import datetime as dt

# Now we can use the shortened name
current_time = dt.datetime.now()
print(current_time)
```

### Creating Your Own Modules

Let's create a simple module to understand how this works:

1. Create a file named `calculator.py` with the following content:

```python
"""
A simple calculator module.

This module provides basic arithmetic functions.
"""

def add(a, b):
    """Add two numbers and return the result."""
    return a + b

def subtract(a, b):
    """Subtract b from a and return the result."""
    return a - b

def multiply(a, b):
    """Multiply two numbers and return the result."""
    return a * b

def divide(a, b):
    """Divide a by b and return the result."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

# Constants
PI = 3.14159
E = 2.71828

# This code only runs when this file is executed directly
if __name__ == "__main__":
    print("Testing the calculator module")
    print(f"2 + 3 = {add(2, 3)}")
    print(f"5 - 2 = {subtract(5, 2)}")
    print(f"3 * 4 = {multiply(3, 4)}")
    print(f"10 / 2 = {divide(10, 2)}")
```

2. Now create another file named `use_calculator.py` in the same directory:

```python
# Import our calculator module
import calculator

# Use functions from our module
result = calculator.add(10, 5)
print(f"10 + 5 = {result}")

result = calculator.subtract(10, 5)
print(f"10 - 5 = {result}")

# Use constants from our module
print(f"The value of PI is approximately {calculator.PI}")
```

When you run `use_calculator.py`, it will import and use the functions and constants from your `calculator.py` module.

### The `if __name__ == "__main__"` Pattern

You might have noticed this pattern in the calculator module:

```python
if __name__ == "__main__":
    # Code here only runs when this file is executed directly
```

When Python runs a file, it sets the special variable `__name__` to `"__main__"` if the file is being run directly. If the file is being imported as a module, `__name__` is set to the module's name.

This pattern allows you to include code that only runs when the file is executed directly, not when it's imported as a module. It's a common pattern for modules that can be both imported and run as scripts.

### Module Search Path

When you import a module, Python looks for it in the following locations:

1. The directory containing the script being run
2. The Python standard library directories
3. The directories listed in the `PYTHONPATH` environment variable
4. Installation-dependent default directories

You can see the full list of directories Python searches by printing `sys.path`:

```python
import sys
print(sys.path)
```

## Packages

A package is a directory containing Python modules and a special `__init__.py` file. Packages allow you to organize related modules into a hierarchical structure.

### Creating a Package

Let's create a simple package to understand the concept:

1. Create a directory named `mathutils`
2. Inside `mathutils`, create an empty file named `__init__.py`
3. Create two module files inside `mathutils`:

`mathutils/basic.py`:

```python
"""Basic math operations."""

def add(a, b):
    return a + b

def subtract(a, b):
    return a - b
```

`mathutils/advanced.py`:

```python
"""Advanced math operations."""

import math

def square_root(x):
    return math.sqrt(x)

def power(base, exponent):
    return base ** exponent
```

4. Finally, create a file named `use_package.py` outside the `mathutils` directory:

```python
# Import specific modules from the package
from mathutils import basic, advanced

# Use functions from the modules
result = basic.add(10, 5)
print(f"10 + 5 = {result}")

result = advanced.power(2, 8)
print(f"2^8 = {result}")

# Alternative import syntax
import mathutils.basic
import mathutils.advanced

result = mathutils.basic.subtract(10, 5)
print(f"10 - 5 = {result}")

result = mathutils.advanced.square_root(16)
print(f"√16 = {result}")
```

When you run `use_package.py`, it will import the modules from your `mathutils` package.

### The `__init__.py` File

The `__init__.py` file serves several purposes:

1. It marks a directory as a Python package
2. It can initialize the package when it's imported
3. It can set up package-level variables
4. It can expose specific modules or functions directly at the package level

Let's modify our `mathutils/__init__.py` file to expose functions directly at the package level:

```python
"""Math utilities package."""

# Import specific functions from modules
from .basic import add, subtract
from .advanced import square_root, power

# Define package-level variables
__version__ = '0.1.0'
__author__ = 'Your Name'
```

Now you can import functions directly from the package:

```python
# Import functions directly from the package
from mathutils import add, square_root

result = add(10, 5)
print(f"10 + 5 = {result}")

result = square_root(16)
print(f"√16 = {result}")

# You can also check package information
import mathutils
print(f"mathutils version: {mathutils.__version__}")
print(f"mathutils author: {mathutils.__author__}")
```

### Namespaces and Scope

Understanding namespaces and scope is important when working with modules and packages:

- **Namespace**: A mapping from names to objects. Different namespaces can coexist at different times, in distinct modules, functions or classes.
- **Scope**: The textual region of a Python program where a namespace is directly accessible.

When you use modules, each module has its own namespace, which helps avoid naming conflicts:

```python
# Module 1: math_operations.py
def add(a, b):
    return a + b

# Module 2: string_operations.py
def add(s1, s2):
    return s1 + s2

# Using both modules
import math_operations
import string_operations

print(math_operations.add(2, 3))           # 5
print(string_operations.add("Hello, ", "World!"))  # "Hello, World!"
```

Without modules, you would have a naming conflict with the two `add` functions.

## Popular Standard Library Modules

Python's standard library is extensive. Here are some commonly used modules:

### `datetime` - Date and Time

```python
from datetime import datetime, timedelta

# Get current date and time
now = datetime.now()
print(f"Current datetime: {now}")

# Create a specific date
new_year = datetime(2025, 1, 1)
print(f"New Year: {new_year}")

# Format a date
formatted = now.strftime("%Y-%m-%d %H:%M:%S")
print(f"Formatted: {formatted}")

# Parse a date string
date_string = "2025-05-21 14:30:00"
parsed_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
print(f"Parsed: {parsed_date}")

# Date arithmetic
tomorrow = now + timedelta(days=1)
print(f"Tomorrow: {tomorrow}")

one_week_ago = now - timedelta(weeks=1)
print(f"One week ago: {one_week_ago}")
```

### `random` - Random Numbers

```python
import random

# Random float between 0 and 1
print(random.random())

# Random integer in range
print(random.randint(1, 100))

# Random choice from a sequence
fruits = ['apple', 'banana', 'cherry']
print(random.choice(fruits))

# Shuffle a list in place
numbers = list(range(1, 11))
random.shuffle(numbers)
print(numbers)

# Random sample without replacement
print(random.sample(range(1, 51), 6))  # 6 random numbers from 1-50
```

### `os` and `os.path` - Operating System Interface

```python
import os

# Current working directory
print(os.getcwd())

# List directory contents
print(os.listdir('.'))

# Join path components properly
path = os.path.join('folder', 'subfolder', 'file.txt')
print(path)

# Check if a file exists
exists = os.path.exists('example.txt')
print(f"File exists: {exists}")

# File information
if os.path.exists('example.txt'):
    size = os.path.getsize('example.txt')
    print(f"File size: {size} bytes")

    mod_time = os.path.getmtime('example.txt')
    print(f"Last modified: {datetime.fromtimestamp(mod_time)}")

# Create a directory
# os.mkdir('new_directory')

# Delete a file
# os.remove('unnecessary_file.txt')
```

### `json` - JSON Encoding and Decoding

```python
import json

# Python dictionary
person = {
    'name': 'Alice',
    'age': 30,
    'city': 'New York',
    'languages': ['Python', 'JavaScript', 'Go'],
    'is_developer': True
}

# Convert to JSON string
json_string = json.dumps(person, indent=4)
print(json_string)

# Convert JSON string back to Python object
decoded = json.loads(json_string)
print(decoded['name'])
print(decoded['languages'][0])

# Write JSON to a file
with open('person.json', 'w') as f:
    json.dump(person, f, indent=4)

# Read JSON from a file
with open('person.json', 'r') as f:
    loaded_person = json.load(f)
    print(loaded_person)
```

## Third-Party Packages

Python's ecosystem includes thousands of third-party packages for various purposes. You can install them using pip, Python's package installer.

Here are a few popular third-party packages:

- **requests**: Simplified HTTP requests
- **numpy**: Numerical computing
- **pandas**: Data analysis and manipulation
- **matplotlib**: Data visualization
- **flask**: Web development
- **django**: Web framework
- **pygame**: Game development
- **pillow**: Image processing
- **tensorflow**: Machine learning

To install a third-party package, use pip:

```bash
pip install requests
```

Then you can use the package in your Python code:

```python
import requests

# Make an HTTP GET request
response = requests.get('https://api.github.com')
print(f"Status code: {response.status_code}")

# Get the response data as JSON
data = response.json()
print(f"API endpoints: {len(data)}")
```

## Virtual Environments

When working on multiple Python projects, you may need different versions of packages for each project. Virtual environments solve this by creating isolated environments for each project.

### Creating a Virtual Environment

```bash
# For Python 3.3+
python -m venv myenv

# Activate the virtual environment
# On Windows:
myenv\Scripts\activate
# On macOS/Linux:
source myenv/bin/activate

# Install packages in the virtual environment
pip install requests

# When you're done, deactivate the environment
deactivate
```

### Using `requirements.txt`

You can list your project's dependencies in a `requirements.txt` file:

```
requests==2.28.1
numpy==1.23.4
pandas==1.5.1
```

Then install all dependencies at once:

```bash
pip install -r requirements.txt
```

## Practical Example: Weather App

Let's build a small weather app that demonstrates the use of modules, packages, and third-party libraries:

```python
"""
Weather App

This script retrieves and displays current weather information
for a specified city using the OpenWeatherMap API.
"""

import os
import json
import datetime
import requests

def get_api_key():
    """Get API key from environment variable or config file."""
    # First, try to get the API key from an environment variable
    api_key = os.environ.get('OPENWEATHERMAP_API_KEY')

    # If not found, try to load from a config file
    if not api_key:
        try:
            with open('config.json', 'r') as f:
                config = json.load(f)
                api_key = config.get('api_key')
        except (FileNotFoundError, json.JSONDecodeError):
            pass

    return api_key

def get_weather(city, api_key):
    """Get current weather for the specified city."""
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        'q': city,
        'appid': api_key,
        'units': 'metric'  # Use metric units (Celsius)
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        if response.status_code == 404:
            print(f"City '{city}' not found. Please check the spelling.")
        else:
            print(f"HTTP error occurred: {http_err}")
    except requests.exceptions.RequestException as err:
        print(f"Error occurred: {err}")

    return None

def display_weather(weather_data):
    """Display the weather information in a formatted way."""
    if not weather_data:
        return

    # Extract relevant information
    city = weather_data['name']
    country = weather_data['sys']['country']
    temp = weather_data['main']['temp']
    feels_like = weather_data['main']['feels_like']
    description = weather_data['weather'][0]['description']
    humidity = weather_data['main']['humidity']
    wind_speed = weather_data['wind']['speed']
    timestamp = weather_data['dt']

    # Convert timestamp to datetime
    dt = datetime.datetime.fromtimestamp(timestamp)
    formatted_date = dt.strftime("%A, %B %d, %Y")
    formatted_time = dt.strftime("%I:%M %p")

    # Display the information
    print("\nCurrent Weather")
    print("==============")
    print(f"Location: {city}, {country}")
    print(f"Date: {formatted_date}")
    print(f"Time: {formatted_time}")
    print(f"Temperature: {temp}°C (Feels like: {feels_like}°C)")
    print(f"Conditions: {description.capitalize()}")
    print(f"Humidity: {humidity}%")
    print(f"Wind Speed: {wind_speed} m/s")

def main():
    """Main function to run the weather app."""
    print("Weather App")
    print("-----------")

    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("Error: API key not found.")
        print("Please set the OPENWEATHERMAP_API_KEY environment variable")
        print("or create a config.json file with your API key.")
        return

    # Get city from user
    city = input("Enter city name: ")

    # Get and display weather
    weather_data = get_weather(city, api_key)
    display_weather(weather_data)

if __name__ == "__main__":
    main()
```

To use this app:

1. Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api)
2. Either set an environment variable `OPENWEATHERMAP_API_KEY` with your API key, or
3. Create a file named `config.json` with the following content:

```json
{
  "api_key": "your_api_key_here"
}
```

This example demonstrates:

1. Importing and using standard library modules (`os`, `json`, `datetime`)
2. Using a third-party package (`requests`)
3. Organizing code into functions
4. The `if __name__ == "__main__"` pattern
5. Error handling with try-except
6. Working with environment variables and configuration files

## Next Steps

You now understand how to use and create modules and packages in Python, which is essential for building larger, more organized projects. In the next section, we'll explore file operations, how to read from and write to files in Python.

Happy coding!
