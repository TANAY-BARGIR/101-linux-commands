---
title: 'Variables and Data Types'
description: 'Learn how to store and manipulate different types of data in Python'
order: 2
---

Variables are containers for storing data values. In Python, variables are created when you assign a value to them. Unlike some other programming languages, Python doesn't require you to declare a variable's type before using it.

## Creating Variables

In Python, you create a variable by assigning a value to a name:

```python
# Creating different variables
name = "Alice"
age = 30
height = 1.75
is_student = True
```

Notice that we don't need to specify the type of the variable - Python figures it out automatically based on the value.

## Variable Naming Rules

When naming variables in Python, follow these rules:

- Variable names can contain letters, numbers, and underscores
- Variable names cannot start with a number
- Variable names are case-sensitive (`name` and `Name` are different variables)
- Variable names should be descriptive and avoid Python keywords (like `print`, `if`, or `for`)

```python
# Good variable names
user_name = "bob_smith"
total_count = 42
is_active = True

# Poor variable names (avoid these)
a = "bob_smith"  # Not descriptive
1st_name = "Bob"  # Cannot start with a number (this will cause an error)
print = "Hello"  # Overrides a Python keyword (bad practice)
```

## Python's Basic Data Types

Python has several built-in data types:

### Numeric Types

```python
# Integer (whole number)
count = 42
temperature = -5

# Float (decimal number)
height = 1.75
pi = 3.14159

# Complex number (real + imaginary)
complex_num = 3 + 4j
```

#### Numeric Operations

```python
# Basic arithmetic
x = 10
y = 3

print(x + y)   # Addition: 13
print(x - y)   # Subtraction: 7
print(x * y)   # Multiplication: 30
print(x / y)   # Division: 3.3333...
print(x // y)  # Integer division (floor): 3
print(x % y)   # Modulus (remainder): 1
print(x ** y)  # Exponentiation: 1000
```

### Strings

Strings are sequences of characters, enclosed in single quotes, double quotes, or triple quotes:

```python
name = "Alice"
message = 'Hello, Python!'
paragraph = """This is a multi-line
string that can span
across multiple lines."""
```

#### String Operations

```python
# String concatenation (joining)
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name  # "John Doe"

# String repetition
excited = "Wow" * 3  # "WowWowWow"

# String indexing (accessing characters)
word = "Python"
first_letter = word[0]  # "P"
last_letter = word[-1]  # "n"

# String slicing (extracting parts)
word = "Python"
substring = word[1:4]  # "yth"

# String methods
message = "hello, world!"
print(message.upper())       # "HELLO, WORLD!"
print(message.capitalize())  # "Hello, world!"
print(message.replace("hello", "goodbye"))  # "goodbye, world!"
print(len(message))          # 13 (length of the string)
```

### Boolean

Boolean values represent truth: `True` or `False`:

```python
is_active = True
is_completed = False

# Boolean operations
print(True and False)  # False
print(True or False)   # True
print(not True)        # False
```

### None Type

`None` represents the absence of a value:

```python
result = None

# Checking for None
if result is None:
    print("No result yet")
```

## Type Conversion

Python allows you to convert between different data types:

```python
# String to int
age_str = "30"
age = int(age_str)  # 30 as an integer

# Int to string
count = 42
count_str = str(count)  # "42" as a string

# String to float
height_str = "1.75"
height = float(height_str)  # 1.75 as a float

# Float to int (truncates decimal part)
price = 9.99
price_int = int(price)  # 9 (decimal part is dropped)
```

## Checking Data Types

To check the type of a variable, use the `type()` function:

```python
name = "Alice"
age = 30
height = 1.75
is_student = True

print(type(name))       # <class 'str'>
print(type(age))        # <class 'int'>
print(type(height))     # <class 'float'>
print(type(is_student)) # <class 'bool'>
```

## String Formatting

Python offers several ways to format strings:

### F-Strings (Python 3.6+)

```python
name = "Alice"
age = 30
message = f"My name is {name} and I am {age} years old."
print(message)  # "My name is Alice and I am 30 years old."

# F-strings with expressions
price = 49.99
quantity = 3
total = price * quantity
print(f"Total cost: ${total:.2f}")  # "Total cost: $149.97"
```

### Format Method

```python
name = "Bob"
age = 25
message = "My name is {} and I am {} years old.".format(name, age)
print(message)  # "My name is Bob and I am 25 years old."

# With named placeholders
message = "My name is {name} and I am {age} years old.".format(name="Charlie", age=35)
print(message)  # "My name is Charlie and I am 35 years old."
```

## Practice: Working with Variables and Data Types

Let's put what we've learned into practice with a simple program:

```python
# A program that calculates age in days, hours, and minutes

# Get user input
name = input("What is your name? ")
age_str = input("How old are you? ")
age = int(age_str)  # Convert string to integer

# Calculate age in different units
days = age * 365
hours = days * 24
minutes = hours * 60

# Create and print the formatted message
message = f"Hi {name}! You are {age} years old.\n"
message += f"That's approximately:\n"
message += f"- {days:,} days\n"
message += f"- {hours:,} hours\n"
message += f"- {minutes:,} minutes"

print(message)
```

Save this as `age_calculator.py` and run it. You should see output like:

```
What is your name? Alice
How old are you? 30
Hi Alice! You are 30 years old.
That's approximately:
- 10,950 days
- 262,800 hours
- 15,768,000 minutes
```

## Next Steps

Now that you understand variables and basic data types, you're ready to add more functionality to your programs. In the next section, we'll explore control flow, how to make decisions and repeat actions in your code.

Happy coding!
