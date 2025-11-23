---
title: 'Error Handling and Exceptions'
description: 'Learn how to handle errors and exceptions in your Python code'
order: 8
---

No matter how carefully you write your code, errors can and will occur. Python provides a robust way to handle these errors through exceptions. In this section, you'll learn how to anticipate, catch, and handle exceptions to make your programs more resilient.

## Understanding Errors and Exceptions

In Python, there are two main types of errors:

1. **Syntax Errors**: These occur when the Python parser can't understand your code due to incorrect syntax. They prevent your program from running.

2. **Exceptions**: These occur during the execution of your program when something unexpected happens.

### Syntax Errors

Syntax errors, also known as parsing errors, are detected when Python tries to interpret your code:

```python
# Syntax error: missing closing parenthesis
print("Hello, world!"
```

This will produce an error like:

```
  File "example.py", line 1
    print("Hello, world!"
                        ^
SyntaxError: unexpected EOF while parsing
```

The arrow points to the earliest point where the error was detected, which isn't always where the error actually is.

### Exceptions

Exceptions occur during program execution and can happen for various reasons, like trying to divide by zero or accessing a file that doesn't exist:

```python
# Exception: division by zero
result = 10 / 0
```

This will produce an error like:

```
Traceback (most recent call last):
  File "example.py", line 1, in <module>
    result = 10 / 0
ZeroDivisionError: division by zero
```

The traceback shows the sequence of function calls that led to the error, with the most recent call at the bottom.

## Common Exception Types

Python has many built-in exceptions. Here are some common ones:

- `ZeroDivisionError`: Raised when dividing by zero
- `TypeError`: Raised when an operation is applied to an object of an inappropriate type
- `ValueError`: Raised when a function receives an argument of the correct type but an inappropriate value
- `NameError`: Raised when a local or global name is not found
- `IndexError`: Raised when a sequence subscript is out of range
- `KeyError`: Raised when a dictionary key is not found
- `FileNotFoundError`: Raised when a file or directory is requested but doesn't exist
- `IOError`: Raised when an I/O operation fails
- `ImportError`: Raised when an import statement fails to find the module or name

Let's see some examples:

```python
# TypeError
result = "42" + 42  # Trying to concatenate a string and an integer

# ValueError
number = int("hello")  # Trying to convert a non-numeric string to an integer

# NameError
print(undefined_variable)  # Using a variable that hasn't been defined

# IndexError
my_list = [1, 2, 3]
item = my_list[10]  # Accessing an index that doesn't exist

# KeyError
my_dict = {"name": "Alice"}
value = my_dict["age"]  # Accessing a key that doesn't exist

# FileNotFoundError
with open("nonexistent_file.txt", "r") as file:
    content = file.read()
```

## Handling Exceptions with try/except

To handle exceptions, you use a `try/except` block. The basic syntax is:

```python
try:
    # Code that might raise an exception
    result = 10 / 0
except ZeroDivisionError:
    # Code to handle the specific exception
    print("Error: Cannot divide by zero")
```

You can handle multiple exceptions either by using multiple `except` blocks or by grouping exceptions:

```python
# Multiple except blocks
try:
    num = int(input("Enter a number: "))
    result = 10 / num
    print(f"Result: {result}")
except ValueError:
    print("Error: Please enter a valid number")
except ZeroDivisionError:
    print("Error: Cannot divide by zero")

# Grouping exceptions
try:
    num = int(input("Enter a number: "))
    result = 10 / num
    print(f"Result: {result}")
except (ValueError, ZeroDivisionError):
    print("Error: Please enter a valid, non-zero number")
```

## Capturing Exception Information

You can capture the exception object to get more information about what went wrong:

```python
try:
    num = int(input("Enter a number: "))
    result = 10 / num
    print(f"Result: {result}")
except Exception as e:
    print(f"An error occurred: {type(e).__name__}: {e}")
```

The `as` keyword assigns the exception object to a variable (in this case, `e`), giving you access to its attributes.

## The else and finally Clauses

You can add an `else` clause that runs if no exceptions are raised, and a `finally` clause that runs whether or not an exception occurs:

```python
try:
    num = int(input("Enter a number: "))
    result = 10 / num
except ValueError:
    print("Error: Please enter a valid number")
except ZeroDivisionError:
    print("Error: Cannot divide by zero")
else:
    # This runs if no exceptions occur
    print(f"Result: {result}")
finally:
    # This always runs, whether an exception occurred or not
    print("Calculation attempt completed")
```

The `finally` clause is useful for cleanup actions like closing files or releasing resources, regardless of whether an exception occurred.

## Using exceptions for flow control

While exceptions are primarily for handling errors, they can also be used for flow control in certain situations. The "Easier to ask for forgiveness than permission" (EAFP) approach is common in Python:

```python
# EAFP approach
try:
    value = my_dict["key"]
    # Use the value...
except KeyError:
    # Handle the case where the key doesn't exist
    value = default_value

# Alternative: "Look before you leap" (LBYL) approach
if "key" in my_dict:
    value = my_dict["key"]
    # Use the value...
else:
    # Handle the case where the key doesn't exist
    value = default_value
```

The EAFP approach can be cleaner and more efficient in many cases, especially when checking for a condition is more expensive than handling the exception.

## Raising Exceptions

You can raise exceptions in your own code using the `raise` statement:

```python
def divide(a, b):
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

try:
    result = divide(10, 0)
except ZeroDivisionError as e:
    print(f"Error: {e}")
```

## Creating Custom Exceptions

You can define your own exception types by creating a class that inherits from `Exception` or one of its subclasses:

```python
class InvalidAgeError(Exception):
    """Raised when the input age is negative or unreasonably high."""
    pass

def validate_age(age):
    if age < 0:
        raise InvalidAgeError("Age cannot be negative")
    if age > 150:
        raise InvalidAgeError("Age is unreasonably high")
    return age

try:
    user_age = int(input("Enter your age: "))
    validated_age = validate_age(user_age)
    print(f"Your age is {validated_age}")
except ValueError:
    print("Error: Please enter a valid number")
except InvalidAgeError as e:
    print(f"Error: {e}")
```

## Exception Hierarchy

Python's exceptions form a hierarchy, with `BaseException` at the top. Here's a simplified view:

```
BaseException
 ├── SystemExit
 ├── KeyboardInterrupt
 ├── GeneratorExit
 └── Exception
      ├── StopIteration
      ├── ArithmeticError
      │    ├── FloatingPointError
      │    ├── OverflowError
      │    └── ZeroDivisionError
      ├── AssertionError
      ├── AttributeError
      ├── ImportError
      │    └── ModuleNotFoundError
      ├── LookupError
      │    ├── IndexError
      │    └── KeyError
      ├── NameError
      ├── OSError
      │    ├── FileNotFoundError
      │    ├── PermissionError
      │    └── ...
      └── ...
```

When handling exceptions, remember that catching a parent exception will also catch all its child exceptions:

```python
try:
    # Some code that might raise various exceptions
    pass
except LookupError:
    # This will catch both IndexError and KeyError
    pass
except OSError:
    # This will catch FileNotFoundError, PermissionError, etc.
    pass
except Exception:
    # This will catch most exceptions
    pass
```

It's generally best to catch specific exceptions rather than using a broad `except Exception` clause, as the latter can mask bugs and make debugging harder.

## The with Statement and Context Managers

We've already seen the `with` statement for file operations:

```python
with open("example.txt", "r") as file:
    content = file.read()
```

This is an example of a context manager, which handles setup (opening the file) and teardown (closing the file) automatically, even if an exception occurs. Context managers are a clean way to handle resources and exceptions.

You can create your own context managers by either using the `contextlib` module or defining a class with `__enter__` and `__exit__` methods:

```python
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode):
    try:
        file = open(filename, mode)
        yield file
    finally:
        file.close()

# Using the custom context manager
with file_manager("example.txt", "r") as file:
    content = file.read()
    print(content)
```

## Assertions

Assertions are a way to check that conditions are as expected during development:

```python
def calculate_average(numbers):
    assert len(numbers) > 0, "Cannot calculate average of empty list"
    return sum(numbers) / len(numbers)

# This will raise an AssertionError
calculate_average([])
```

Assertions are primarily a debugging aid and can be disabled in optimized mode (`python -O`), so don't use them for input validation or enforcing conditions in production code.

## Practical Example: A Robust Configuration Parser

Let's build a practical example that demonstrates error handling with a configuration file parser:

```python
"""
Config Parser

A module for parsing configuration files with robust error handling.
"""

class ConfigError(Exception):
    """Base class for configuration-related errors."""
    pass

class ConfigParseError(ConfigError):
    """Raised when there's a problem parsing the configuration file."""
    def __init__(self, message, line_number=None, line_content=None):
        self.line_number = line_number
        self.line_content = line_content
        super().__init__(f"{message}" +
                         (f" on line {line_number}" if line_number else "") +
                         (f": '{line_content}'" if line_content else ""))

class ConfigKeyError(ConfigError):
    """Raised when a required key is missing."""
    pass

class ConfigTypeError(ConfigError):
    """Raised when a value has the wrong type."""
    pass

def parse_config_file(file_path):
    """
    Parse a configuration file and return a dictionary of settings.

    The file should have lines in the format "key = value".
    Lines starting with # are treated as comments.

    Args:
        file_path (str): Path to the configuration file

    Returns:
        dict: The parsed configuration

    Raises:
        FileNotFoundError: If the file doesn't exist
        ConfigParseError: If there's a problem parsing the file
    """
    config = {}

    try:
        with open(file_path, 'r') as file:
            for line_number, line in enumerate(file, 1):
                line = line.strip()

                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue

                # Parse key-value pairs
                try:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()

                    # Check for empty key
                    if not key:
                        raise ConfigParseError("Empty key", line_number, line)

                    # Store the key-value pair
                    config[key] = value

                except ValueError:
                    # Couldn't unpack the line into key and value
                    raise ConfigParseError("Invalid format", line_number, line)

        return config

    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found: {file_path}")
    except Exception as e:
        # Catch any other exceptions and re-raise as ConfigParseError
        if not isinstance(e, ConfigError):
            raise ConfigParseError(f"Unexpected error: {e}")
        raise

def get_string(config, key, default=None):
    """Get a string value from the configuration."""
    try:
        return config[key]
    except KeyError:
        if default is not None:
            return default
        raise ConfigKeyError(f"Missing required key: {key}")

def get_int(config, key, default=None):
    """Get an integer value from the configuration."""
    try:
        value = config[key]
        return int(value)
    except KeyError:
        if default is not None:
            return default
        raise ConfigKeyError(f"Missing required key: {key}")
    except ValueError:
        raise ConfigTypeError(f"Value for {key} is not a valid integer: {value}")

def get_float(config, key, default=None):
    """Get a float value from the configuration."""
    try:
        value = config[key]
        return float(value)
    except KeyError:
        if default is not None:
            return default
        raise ConfigKeyError(f"Missing required key: {key}")
    except ValueError:
        raise ConfigTypeError(f"Value for {key} is not a valid float: {value}")

def get_boolean(config, key, default=None):
    """Get a boolean value from the configuration."""
    try:
        value = config[key].lower()
        if value in ('true', 'yes', '1', 'on'):
            return True
        if value in ('false', 'no', '0', 'off'):
            return False
        raise ConfigTypeError(f"Value for {key} is not a valid boolean: {value}")
    except KeyError:
        if default is not None:
            return default
        raise ConfigKeyError(f"Missing required key: {key}")

def main():
    """Main function demonstrating the config parser."""
    config_file = input("Enter configuration file path: ")

    try:
        config = parse_config_file(config_file)
        print("Configuration loaded successfully.")

        # Access configuration values
        try:
            host = get_string(config, "host", default="localhost")
            port = get_int(config, "port", default=8080)
            max_connections = get_int(config, "max_connections")
            timeout = get_float(config, "timeout", default=30.0)
            debug = get_boolean(config, "debug", default=False)

            print("\nConfiguration values:")
            print(f"Host: {host}")
            print(f"Port: {port}")
            print(f"Max Connections: {max_connections}")
            print(f"Timeout: {timeout} seconds")
            print(f"Debug Mode: {'Enabled' if debug else 'Disabled'}")

        except ConfigKeyError as e:
            print(f"Configuration error: {e}")
        except ConfigTypeError as e:
            print(f"Configuration error: {e}")

    except FileNotFoundError as e:
        print(f"Error: {e}")
    except ConfigParseError as e:
        if e.line_number:
            print(f"Error parsing configuration on line {e.line_number}: {e}")
        else:
            print(f"Error parsing configuration: {e}")
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    main()
```

To use this example, create a sample configuration file called `config.ini`:

```
# Sample configuration file

host = example.com
port = 443
max_connections = 100
timeout = 5.5
debug = true
```

This example demonstrates:

1. Creating a custom exception hierarchy for specific error types
2. Using try/except blocks to handle different kinds of errors
3. Converting user input to appropriate data types with error handling
4. Providing helpful error messages with context information
5. Using default values when appropriate
6. Properly propagating and re-raising exceptions

## Best Practices for Exception Handling

1. **Be specific**: Catch specific exceptions rather than using a broad `except` clause.
2. **Keep try blocks small**: Only put code that might raise an exception in the try block.
3. **Handle exceptions gracefully**: Provide helpful error messages and recovery options.
4. **Don't silence exceptions**: Avoid empty except blocks that hide errors.
5. **Use finally for cleanup**: Use finally to ensure resources are properly released.
6. **Use context managers**: They handle resource management and exceptions cleanly.
7. **Reraise when appropriate**: Re-raise exceptions to propagate them to the caller.
8. **Log exceptions**: In larger applications, log exceptions for debugging and monitoring.

## Next Steps

Error handling is a critical skill for writing robust Python programs. By anticipating and handling exceptions properly, you can make your programs more resilient to unexpected situations and provide better user experiences.

In the next section, we'll explore object-oriented programming in Python, which will allow you to create reusable, modular code by defining your own types with classes and objects.

Happy coding!
