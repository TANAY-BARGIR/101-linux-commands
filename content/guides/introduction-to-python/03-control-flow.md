---
title: 'Control Flow'
description: 'Make decisions and control the execution flow of your Python programs'
order: 3
---

Control flow is how we direct the execution path of a program based on conditions and loops. In this section, you'll learn how to use conditional statements, loops, and comparison operators to control how your Python code executes.

## Comparison Operators

Before diving into conditional statements, let's understand the comparison operators in Python:

```python
# Equal to
print(5 == 5)   # True
print("a" == "b")  # False

# Not equal to
print(5 != 10)  # True

# Greater than
print(10 > 5)   # True

# Less than
print(5 < 10)   # True

# Greater than or equal to
print(10 >= 10) # True

# Less than or equal to
print(5 <= 5)   # True
```

## Conditional Statements

Conditional statements allow your program to make decisions based on conditions.

### If Statement

The `if` statement executes a block of code if a specified condition is true:

```python
# Basic if statement
temperature = 28

if temperature > 25:
    print("It's a hot day!")
    print("Don't forget to stay hydrated.")

print("This line always executes")
```

Notice that in Python, the code block under an `if` statement is indented. Python uses indentation to define blocks of code.

### If-Else Statement

The `if-else` statement executes one block of code if a condition is true and another if it's false:

```python
# if-else statement
temperature = 15

if temperature > 25:
    print("It's a hot day!")
    print("Don't forget to stay hydrated.")
else:
    print("It's not very hot today.")
    print("Enjoy the cooler weather!")

print("This line always executes")
```

### If-Elif-Else Statement

The `elif` (short for "else if") statement allows you to check multiple conditions:

```python
# if-elif-else statement
temperature = 15

if temperature > 30:
    print("It's very hot!")
    print("Stay hydrated and avoid direct sun.")
elif temperature > 20:
    print("It's a warm day.")
    print("Perfect for outdoor activities.")
elif temperature > 10:
    print("It's a bit cool today.")
    print("You might want a light jacket.")
else:
    print("It's cold!")
    print("Don't forget your coat.")

print("This line always executes")
```

The conditions are checked in order. Once a condition is true, its code block executes, and the rest of the conditions are skipped.

### Nested Conditional Statements

You can also nest conditional statements inside each other:

```python
# Nested if statements
temperature = 25
is_raining = False

if temperature > 20:
    print("It's warm outside.")

    if is_raining:
        print("But it's raining, take an umbrella!")
    else:
        print("And it's not raining, enjoy the sunshine!")
else:
    print("It's cold outside.")

    if is_raining:
        print("And it's raining, better stay inside.")
    else:
        print("But at least it's not raining.")
```

### Conditional Expressions (Ternary Operator)

Python has a compact way to write simple if-else statements:

```python
# Ternary operator
age = 20
status = "adult" if age >= 18 else "minor"
print(status)  # "adult"
```

This is equivalent to:

```python
if age >= 18:
    status = "adult"
else:
    status = "minor"
```

## Logical Operators

Logical operators combine conditional statements:

```python
# and - both conditions must be true
temp = 25
is_sunny = True

if temp > 20 and is_sunny:
    print("It's a warm, sunny day!")

# or - at least one condition must be true
if temp > 30 or is_sunny:
    print("Either it's very hot or it's sunny, or both!")

# not - inverts a condition
if not is_sunny:
    print("It's not sunny today.")
else:
    print("It's sunny today!")
```

You can combine multiple logical operators:

```python
temp = 25
is_sunny = True
is_weekend = False

if temp > 20 and (is_sunny or is_weekend):
    print("Good day for outdoor activities!")
```

## Loops

Loops allow you to execute a block of code multiple times.

### For Loops

For loops iterate over a sequence (like a list, tuple, or string):

```python
# Iterating over a range of numbers
for i in range(5):  # 0, 1, 2, 3, 4
    print(i)

# Iterating over a string
for char in "Python":
    print(char)

# Iterating over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}s")

# Using range with start, stop, and step
for i in range(2, 10, 2):  # 2, 4, 6, 8
    print(i)
```

### While Loops

While loops execute a block of code as long as a condition is true:

```python
# Basic while loop
count = 1
while count <= 5:
    print(count)
    count += 1  # Don't forget to update the condition, or you'll have an infinite loop!

# Breaking out of a while loop
count = 1
while True:  # Infinite loop
    print(count)
    count += 1
    if count > 5:
        break  # Exit the loop when count exceeds 5
```

### Loop Control Statements

Python provides statements to control the flow of loops:

```python
# break - exits the loop entirely
for i in range(10):
    if i == 5:
        break  # Exit the loop when i equals 5
    print(i)  # Prints 0, 1, 2, 3, 4

# continue - skips the current iteration and continues with the next
for i in range(10):
    if i % 2 == 0:
        continue  # Skip even numbers
    print(i)  # Prints 1, 3, 5, 7, 9

# else clause in loops - executes after the loop completes normally (not via break)
for i in range(5):
    print(i)
else:
    print("Loop completed successfully")

# When a break occurs, the else clause doesn't execute
for i in range(5):
    if i == 3:
        break
    print(i)
else:
    print("This won't print because the loop was exited with a break")
```

## Practical Example: A Simple Number Guessing Game

Let's put these concepts together in a simple number guessing game:

```python
import random

# Generate a random number between 1 and 100
secret_number = random.randint(1, 100)
attempts = 0
max_attempts = 7

print("Welcome to the Number Guessing Game!")
print(f"I'm thinking of a number between 1 and 100. You have {max_attempts} attempts.")

while attempts < max_attempts:
    # Get user input
    try:
        guess_str = input("Enter your guess: ")
        guess = int(guess_str)
    except ValueError:
        print("Please enter a valid number.")
        continue

    # Increment attempt counter
    attempts += 1

    # Check the guess
    if guess < secret_number:
        print(f"Too low! You have {max_attempts - attempts} attempts left.")
    elif guess > secret_number:
        print(f"Too high! You have {max_attempts - attempts} attempts left.")
    else:
        print(f"Congratulations! You guessed the number in {attempts} attempts.")
        break

# This executes if the loop completes without a break (player didn't guess correctly)
else:
    print(f"Sorry, you've run out of attempts. The number was {secret_number}.")

print("Thanks for playing!")
```

Save this as `number_guessing_game.py` and run it. This example combines many of the concepts we've covered:

1. Conditional statements (`if`, `elif`, `else`)
2. Loops (`while`)
3. Loop control statements (`break`, `continue`)
4. Exception handling (`try`/`except`)
5. Input and output
6. Type conversion (`int()`)

## Next Steps

Now that you understand control flow in Python, you have the tools to create programs that can make decisions and repeat actions. In the next section, we'll explore functions, reusable blocks of code that make your programs more modular and maintainable.

Happy coding!
