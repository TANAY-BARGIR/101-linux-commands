---
title: 'Control Structures'
description: 'Learn decision-making and looping in Bash with conditionals and loops to create dynamic scripts'
order: 5
---

Control structures are essential components of any programming language, allowing you to control the flow of execution in your scripts. In this section, we'll explore Bash's conditional statements and loops that enable you to make decisions and repeat actions.

## Conditional Statements

Conditional statements let your script make decisions based on certain conditions.

### if-else Statements

The basic syntax of an `if` statement in Bash:

```bash
if [ condition ]; then
    # Commands to execute if condition is true
fi
```

Adding an `else` clause:

```bash
if [ condition ]; then
    # Commands for true condition
else
    # Commands for false condition
fi
```

For multiple conditions, use `elif` (else if):

```bash
if [ condition1 ]; then
    # Commands for condition1
elif [ condition2 ]; then
    # Commands for condition2
else
    # Commands for all other cases
fi
```

Here's a practical example that checks if a file exists:

```bash
#!/bin/bash

filename="config.txt"

if [ -f "$filename" ]; then
    echo "$filename exists."
else
    echo "$filename does not exist."
    echo "Creating $filename..."
    touch "$filename"
fi
```

### Test Conditions

The square brackets `[ ]` in the examples above are actually a shorthand for the `test` command. Here are some common test conditions:

**File Tests:**

```bash
[ -f file ]  # True if file exists and is a regular file
[ -d dir ]   # True if dir exists and is a directory
[ -e file ]  # True if file exists (any type)
[ -r file ]  # True if file exists and is readable
[ -w file ]  # True if file exists and is writable
[ -x file ]  # True if file exists and is executable
[ -s file ]  # True if file exists and has size greater than zero
```

**String Tests:**

```bash
[ -z string ]      # True if string is empty
[ -n string ]      # True if string is not empty
[ string1 = string2 ]  # True if strings are equal
[ string1 != string2 ] # True if strings are not equal
```

**Integer Comparisons:**

```bash
[ int1 -eq int2 ]  # Equal to
[ int1 -ne int2 ]  # Not equal to
[ int1 -lt int2 ]  # Less than
[ int1 -le int2 ]  # Less than or equal to
[ int1 -gt int2 ]  # Greater than
[ int1 -ge int2 ]  # Greater than or equal to
```

**Logical Operators:**

```bash
[ condition1 -a condition2 ]  # AND (both must be true)
[ condition1 -o condition2 ]  # OR (at least one must be true)
[ ! condition ]               # NOT (negation)
```

### Modern Test Syntax

Bash also provides the `[[ ]]` construct, which is more powerful than the traditional `[ ]`:

```bash
if [[ condition ]]; then
    # Commands
fi
```

Advantages of `[[ ]]` include:

- No need to quote variables to handle spaces
- Support for additional operators like `&&` and `||` for logical AND and OR
- Pattern matching with the `=~` operator for regular expressions

Example using `[[ ]]`:

```bash
#!/bin/bash

filename="my document.txt"

# No need to quote $filename with [[ ]]
if [[ -f $filename && -r $filename ]]; then
    echo "$filename exists and is readable."
fi

# Regular expression matching
email="user@example.com"
if [[ $email =~ [a-z]+@[a-z]+\.[a-z]+ ]]; then
    echo "$email is a valid email format."
fi
```

### Arithmetic Tests with (( ))

For numeric comparisons, you can use the `(( ))` construct, which allows for more natural mathematical syntax:

```bash
if (( expression )); then
    # Commands
fi
```

Example:

```bash
#!/bin/bash

age=25

if (( age >= 18 )); then
    echo "Adult"
else
    echo "Minor"
fi

# You can use variables without $
if (( age * 2 > 40 )); then
    echo "Double your age is greater than 40"
fi
```

### case Statement

The `case` statement provides a cleaner way to match multiple values:

```bash
case $variable in
    pattern1)
        # Commands for pattern1
        ;;
    pattern2)
        # Commands for pattern2
        ;;
    *)
        # Default case (like else)
        ;;
esac
```

Example:

```bash
#!/bin/bash

fruit="apple"

case $fruit in
    "apple")
        echo "It's an apple."
        ;;
    "banana" | "plantain")
        echo "It's a banana or plantain."
        ;;
    "orange" | "tangerine")
        echo "It's a citrus fruit."
        ;;
    *)
        echo "Unknown fruit."
        ;;
esac
```

## Loops

Loops allow you to repeat commands multiple times.

### for Loops

The basic syntax for a `for` loop:

```bash
for variable in list; do
    # Commands using $variable
done
```

Examples:

```bash
# Loop through a list of strings
for fruit in apple banana orange; do
    echo "I like $fruit"
done

# Loop through an array
fruits=("apple" "banana" "orange")
for fruit in "${fruits[@]}"; do
    echo "Processing $fruit"
done

# Loop through a range of numbers
for i in {1..5}; do
    echo "Number: $i"
done

# Loop with step value (Bash 4.0+)
for i in {1..10..2}; do  # Increment by 2
    echo "Odd number: $i"
done

# C-style for loop
for ((i=0; i<5; i++)); do
    echo "Count: $i"
done
```

### while Loops

The `while` loop executes as long as a condition is true:

```bash
while [ condition ]; do
    # Commands
done
```

Examples:

```bash
# Simple counter
count=1
while [ $count -le 5 ]; do
    echo "Count: $count"
    ((count++))
done

# Reading lines from a file
while read line; do
    echo "Line: $line"
done < input.txt

# Infinite loop (requires explicit break)
while true; do
    echo "Press q to quit"
    read -n 1 input
    if [ "$input" = "q" ]; then
        break
    fi
done
```

### until Loops

The `until` loop is similar to `while`, but runs until a condition becomes true:

```bash
until [ condition ]; do
    # Commands
done
```

Example:

```bash
count=1
until [ $count -gt 5 ]; do
    echo "Count: $count"
    ((count++))
done
```

### Loop Control

Bash provides statements to control loop execution:

```bash
# Skip the current iteration
for i in {1..10}; do
    if (( i % 2 == 0 )); then
        continue  # Skip even numbers
    fi
    echo "Odd number: $i"
done

# Exit the loop entirely
for i in {1..100}; do
    echo "Number: $i"
    if [ $i -eq 5 ]; then
        break  # Stop at 5
    fi
done
```

## Combining Control Structures

You can nest control structures to create more complex logic:

```bash
#!/bin/bash

# Check all files in current directory
for file in *; do
    if [ -f "$file" ]; then
        echo "$file is a regular file"

        if [ -x "$file" ]; then
            echo "  and it's executable"
        elif [ -r "$file" ]; then
            echo "  and it's readable"
        fi

        # Get file extension
        filename=$(basename "$file")
        extension="${filename##*.}"

        case $extension in
            "txt")
                echo "  Text file detected"
                ;;
            "sh")
                echo "  Shell script detected"
                ;;
            *)
                echo "  Unknown file type"
                ;;
        esac
    elif [ -d "$file" ]; then
        echo "$file is a directory"
    fi
done
```

## Error Handling

Use conditional statements to handle errors:

```bash
#!/bin/bash

# Attempt to create a directory
mkdir -p /tmp/test_dir

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Directory created successfully"
else
    echo "Failed to create directory"
    exit 1  # Exit with error status
fi
```

You can also use the `||` operator for error handling:

```bash
# If mkdir fails, execute the second command
mkdir /tmp/test_dir || echo "Failed to create directory"

# More complex handling
mkdir /tmp/test_dir || { echo "Failed to create directory"; exit 1; }
```

Similarly, use `&&` to execute a command only if the previous one succeeded:

```bash
# Change to the directory only if it was created successfully
mkdir /tmp/test_dir && cd /tmp/test_dir
```

## Practical Examples

Let's put everything together with some real-world examples:

### Processing Files in a Directory

```bash
#!/bin/bash

# Process all text files in the current directory
for file in *.txt; do
    # Skip if no txt files exist
    if [ "$file" = "*.txt" ]; then
        echo "No text files found."
        break
    fi

    echo "Processing $file..."

    # Skip empty files
    if [ ! -s "$file" ]; then
        echo "  Skipping empty file"
        continue
    fi

    # Count lines, words, and characters
    lines=$(wc -l < "$file")
    words=$(wc -w < "$file")
    chars=$(wc -c < "$file")

    echo "  Lines: $lines"
    echo "  Words: $words"
    echo "  Characters: $chars"
done
```

### Interactive Menu

```bash
#!/bin/bash

while true; do
    clear
    echo "--------------------------"
    echo "       System Menu       "
    echo "--------------------------"
    echo "1. Show date and time"
    echo "2. Show system uptime"
    echo "3. Show logged-in users"
    echo "4. Check disk space"
    echo "5. Exit"
    echo
    read -p "Enter your choice [1-5]: " choice

    case $choice in
        1)
            echo
            date
            ;;
        2)
            echo
            uptime
            ;;
        3)
            echo
            who
            ;;
        4)
            echo
            df -h
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
    esac

    echo
    read -p "Press Enter to continue..."
done
```

With these control structures, you can create dynamic, responsive scripts that make decisions and handle different situations effectively. In the next section, we'll explore functions, which allow you to organize your code into reusable blocks.
