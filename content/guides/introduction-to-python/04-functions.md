---
title: 'Functions'
description: 'Create reusable blocks of code to make your programs more organized and modular'
order: 4
---

Functions are blocks of reusable code designed to perform a specific task. They help you organize your code, make it more reusable, and break complex problems into smaller, manageable parts.

## Defining and Calling Functions

Here's how to define a simple function in Python:

```python
# Define a function
def greet():
    print("Hello, world!")

# Call the function
greet()  # Output: Hello, world!
```

This function doesn't take any parameters or return any values. Let's look at more complex examples.

## Parameters and Arguments

Parameters are variables listed in the function definition. Arguments are the values you pass to the function when calling it.

```python
# Function with parameters
def greet_person(name):
    print(f"Hello, {name}!")

# Call the function with an argument
greet_person("Alice")  # Output: Hello, Alice!
greet_person("Bob")    # Output: Hello, Bob!
```

Functions can have multiple parameters:

```python
def describe_pet(animal_type, pet_name):
    print(f"I have a {animal_type} named {pet_name}.")

describe_pet("dog", "Rex")  # Output: I have a dog named Rex.
describe_pet("cat", "Whiskers")  # Output: I have a cat named Whiskers.
```

### Default Parameter Values

You can specify default values for parameters, which are used when arguments aren't provided:

```python
def greet_person(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

greet_person("Alice")  # Output: Hello, Alice!
greet_person("Bob", "Hi")  # Output: Hi, Bob!
```

### Keyword Arguments

You can use parameter names when calling functions to make your code more readable and to specify arguments in any order:

```python
def describe_pet(animal_type, pet_name):
    print(f"I have a {animal_type} named {pet_name}.")

# Using keyword arguments
describe_pet(animal_type="hamster", pet_name="Harry")
describe_pet(pet_name="Harry", animal_type="hamster")  # Same result, different order
```

## Return Values

Functions can return values using the `return` statement:

```python
def add_numbers(a, b):
    return a + b

sum_result = add_numbers(5, 3)
print(sum_result)  # Output: 8
```

A function can return multiple values as a tuple:

```python
def get_dimensions():
    return 1920, 1080

width, height = get_dimensions()
print(f"Width: {width}, Height: {height}")  # Output: Width: 1920, Height: 1080
```

If a function doesn't explicitly return a value, it implicitly returns `None`:

```python
def no_return():
    print("This function doesn't return anything.")

result = no_return()
print(result)  # Output: None
```

## Variable Scope

Variables defined inside a function have a local scope, which means they're only accessible within that function:

```python
def my_function():
    local_var = "I'm local"
    print(local_var)  # This works

my_function()
# print(local_var)  # This would cause an error because local_var is not defined outside the function
```

Variables defined outside any function have a global scope:

```python
global_var = "I'm global"

def my_function():
    print(global_var)  # You can access global variables inside functions

my_function()  # Output: I'm global
```

If you want to modify a global variable inside a function, you need to use the `global` keyword:

```python
counter = 0

def increment_counter():
    global counter  # Tell Python we want to use the global counter
    counter += 1
    print(f"Counter: {counter}")

increment_counter()  # Output: Counter: 1
increment_counter()  # Output: Counter: 2
```

## Docstrings

Docstrings (documentation strings) explain what a function does. They help other developers (and future you) understand your code:

```python
def calculate_area(length, width):
    """
    Calculate the area of a rectangle.

    Args:
        length (float): The length of the rectangle.
        width (float): The width of the rectangle.

    Returns:
        float: The area of the rectangle.
    """
    return length * width

# You can access the docstring
print(calculate_area.__doc__)
```

## \*args and \*\*kwargs

Python allows you to define functions that can accept a variable number of arguments:

### \*args (Positional Arguments)

```python
def sum_all(*args):
    """Sum all the numbers passed to the function."""
    total = 0
    for num in args:
        total += num
    return total

print(sum_all(1, 2, 3))  # Output: 6
print(sum_all(1, 2, 3, 4, 5))  # Output: 15
```

### \*\*kwargs (Keyword Arguments)

```python
def print_info(**kwargs):
    """Print information about a person."""
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=30, city="New York")
# Output:
# name: Alice
# age: 30
# city: New York
```

## Lambda Functions

Lambda functions are small, anonymous functions defined with the `lambda` keyword:

```python
# Regular function
def add(a, b):
    return a + b

# Equivalent lambda function
add_lambda = lambda a, b: a + b

print(add(5, 3))       # Output: 8
print(add_lambda(5, 3))  # Output: 8
```

Lambda functions are often used with functions like `map()`, `filter()`, and `sorted()`:

```python
# Using lambda with map
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))
print(squared)  # Output: [1, 4, 9, 16, 25]

# Using lambda with filter
even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
print(even_numbers)  # Output: [2, 4]

# Using lambda with sorted
people = [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
    {"name": "Charlie", "age": 35}
]
sorted_people = sorted(people, key=lambda person: person["age"])
print(sorted_people)
# Output: [{'name': 'Bob', 'age': 25}, {'name': 'Alice', 'age': 30}, {'name': 'Charlie', 'age': 35}]
```

## Recursion

A function can call itself, which is known as recursion. This is useful for solving problems that can be broken down into smaller, similar subproblems:

```python
def factorial(n):
    """Calculate the factorial of a number using recursion."""
    # Base case
    if n == 0 or n == 1:
        return 1
    # Recursive case
    else:
        return n * factorial(n - 1)

print(factorial(5))  # Output: 120 (5 * 4 * 3 * 2 * 1)
```

Be careful with recursion, as it can lead to a stack overflow if the recursion depth is too high. Python limits recursion depth to prevent this.

## Practical Example: A Temperature Converter

Let's build a practical temperature converter using functions:

```python
def celsius_to_fahrenheit(celsius):
    """
    Convert Celsius to Fahrenheit.

    Args:
        celsius (float): Temperature in Celsius.

    Returns:
        float: Temperature in Fahrenheit.
    """
    return (celsius * 9/5) + 32

def fahrenheit_to_celsius(fahrenheit):
    """
    Convert Fahrenheit to Celsius.

    Args:
        fahrenheit (float): Temperature in Fahrenheit.

    Returns:
        float: Temperature in Celsius.
    """
    return (fahrenheit - 32) * 5/9

def kelvin_to_celsius(kelvin):
    """
    Convert Kelvin to Celsius.

    Args:
        kelvin (float): Temperature in Kelvin.

    Returns:
        float: Temperature in Celsius.
    """
    return kelvin - 273.15

def celsius_to_kelvin(celsius):
    """
    Convert Celsius to Kelvin.

    Args:
        celsius (float): Temperature in Celsius.

    Returns:
        float: Temperature in Kelvin.
    """
    return celsius + 273.15

def convert_temperature(value, from_unit, to_unit):
    """
    Convert a temperature from one unit to another.

    Args:
        value (float): The temperature value to convert.
        from_unit (str): The unit to convert from ('C', 'F', or 'K').
        to_unit (str): The unit to convert to ('C', 'F', or 'K').

    Returns:
        float: The converted temperature.
    """
    # First convert to Celsius as an intermediate step
    if from_unit == 'C':
        celsius = value
    elif from_unit == 'F':
        celsius = fahrenheit_to_celsius(value)
    elif from_unit == 'K':
        celsius = kelvin_to_celsius(value)
    else:
        raise ValueError("From unit must be 'C', 'F', or 'K'")

    # Then convert from Celsius to the target unit
    if to_unit == 'C':
        return celsius
    elif to_unit == 'F':
        return celsius_to_fahrenheit(celsius)
    elif to_unit == 'K':
        return celsius_to_kelvin(celsius)
    else:
        raise ValueError("To unit must be 'C', 'F', or 'K'")

# Main program
def main():
    print("Temperature Converter")
    print("---------------------")
    print("Units: 'C' for Celsius, 'F' for Fahrenheit, 'K' for Kelvin")

    try:
        value = float(input("Enter the temperature value: "))
        from_unit = input("Enter the unit to convert from (C/F/K): ").upper()
        to_unit = input("Enter the unit to convert to (C/F/K): ").upper()

        result = convert_temperature(value, from_unit, to_unit)
        print(f"{value} {from_unit} = {result:.2f} {to_unit}")

    except ValueError as e:
        print(f"Error: {e}")

# Only run the main function if this file is run directly (not imported)
if __name__ == "__main__":
    main()
```

Save this as `temperature_converter.py` and run it. This example demonstrates several key concepts:

1. Function definitions with parameters and return values
2. Docstrings
3. Function composition (functions calling other functions)
4. Error handling with exceptions
5. The `if __name__ == "__main__"` pattern (more on this in the modules section)

## Next Steps

Functions are a fundamental building block in Python programming. By learning functions, you've taken a significant step toward writing more organized, reusable, and maintainable code.

In the next section, we'll explore Python's data structures, including lists, tuples, dictionaries, and sets, which will allow you to work with collections of data more effectively.

Happy coding!
