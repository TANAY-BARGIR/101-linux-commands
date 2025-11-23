---
title: 'Bash Variables'
description: 'Learn how to work with variables to store, manipulate, and use data in your Bash scripts'
order: 4
---

Variables are essential in any programming language, including Bash. They allow you to store and manipulate data, making your scripts more flexible and powerful. In this section, we'll explore how to work with variables effectively in Bash.

## Variable Basics

In Bash, you create variables by assigning a value to a name:

```bash
# Variable assignment (no spaces around the =)
username="john"
count=42
today=$(date)  # Command substitution
```

To access the value of a variable, prefix it with a `$`:

```bash
echo $username
echo "The count is $count"
echo "Today is $today"
```

You can also use the `${variable}` format, which is useful when the variable name is adjacent to other text:

```bash
echo "Hello, ${username}s of the world"  # Without braces, this would look for a variable named "usernames"
```

## Variable Types and Restrictions

Bash variables don't have explicit types like in other languages. However, they can store:

- Strings: `name="John Doe"`
- Integers: `age=25`
- Arrays: `fruits=("apple" "banana" "cherry")`

Variable naming rules:

- Can contain letters, numbers, and underscores
- Must start with a letter or underscore
- Are case-sensitive (`Name` and `name` are different variables)
- Cannot contain spaces or special characters

```bash
# Valid variable names
user_name="john"
_count=5
longVariableName="value"

# Invalid variable names
# 2ndUser="alice"   # Starts with a number
# user-name="bob"   # Contains a hyphen
# my variable="test"  # Contains a space
```

## Working with Strings

Strings are sequences of characters and are the most common variable type in Bash:

```bash
# String concatenation
first_name="John"
last_name="Doe"
full_name="$first_name $last_name"
echo $full_name  # Output: John Doe

# String length
echo ${#full_name}  # Output: 8

# Substring extraction (start at position 0, take 4 characters)
echo ${full_name:0:4}  # Output: John

# String replacement
message="Hello, world!"
echo ${message/world/everyone}  # Output: Hello, everyone!
```

## Working with Numbers

Bash itself doesn't support arithmetic operations directly, but it provides several ways to perform calculations:

```bash
# Using let
let result=5+7
echo $result  # Output: 12

# Using (( )) for arithmetic expressions
((result = 5 + 7))
echo $result  # Output: 12

# Using $[ ] (older syntax)
result=$[5 + 7]
echo $result  # Output: 12

# Using expr (external command)
result=$(expr 5 + 7)
echo $result  # Output: 12

# Using bc for floating-point calculations
result=$(echo "5.2 + 7.3" | bc)
echo $result  # Output: 12.5
```

The most common approach is using `(( ))` for integer arithmetic and `bc` for floating-point operations.

## Working with Arrays

Bash supports indexed arrays (with numeric indices) and, in newer versions, associative arrays (with string indices):

```bash
# Creating an indexed array
fruits=("apple" "banana" "cherry")

# Accessing array elements (zero-indexed)
echo ${fruits[0]}  # Output: apple

# Getting all elements
echo ${fruits[@]}  # Output: apple banana cherry

# Getting array length
echo ${#fruits[@]}  # Output: 3

# Adding elements
fruits+=("orange")
echo ${fruits[@]}  # Output: apple banana cherry orange

# Removing elements
unset fruits[1]
echo ${fruits[@]}  # Output: apple cherry orange
```

For associative arrays (requires Bash 4.0+):

```bash
# Declare an associative array
declare -A user_info

# Assign values
user_info["name"]="John"
user_info["age"]=30
user_info["city"]="New York"

# Accessing elements
echo ${user_info["name"]}  # Output: John

# Get all keys
echo ${!user_info[@]}  # Output: name age city

# Get all values
echo ${user_info[@]}  # Output: John 30 New York
```

## Variable Scope and Exportation

By default, variables in Bash are local to the current shell session. To make them available to child processes (including scripts you call), you need to export them:

```bash
# Set a variable
message="Hello from parent"

# Export it
export message

# Now when you run another script, it will have access to the message variable
./another_script.sh
```

Inside a function, variables are global by default unless declared with the `local` keyword:

```bash
function process_data() {
    # Local variable - only visible within this function
    local temp_value=123

    # Global variable - visible throughout the script
    result="Processed data"
}
```

## Special Variables

Bash has several built-in variables that provide useful information:

```bash
echo $0     # Script name
echo $1     # First argument to the script
echo $2     # Second argument to the script
echo $#     # Number of arguments
echo $@     # All arguments
echo $?     # Exit status of the last command
echo $$     # Process ID of the current shell
echo $USER  # Current username
echo $HOME  # Home directory
echo $PWD   # Current directory
echo $RANDOM # Random number between 0 and 32767
```

## Variable Manipulation and Expansion

Bash offers powerful ways to manipulate variables:

```bash
filename="document.txt"

# Default values
echo ${undefined_var:-default}  # Use default if undefined_var is not set

# Assign default values
${undefined_var:=default}  # Set undefined_var to default if not set
echo $undefined_var  # Now it's "default"

# Error if not set
# ${required_var:?Error message}  # Exits with error if required_var is not set

# Remove prefix pattern
echo ${filename#doc}  # Output: ument.txt

# Remove suffix pattern
echo ${filename%.txt}  # Output: document

# Replace all occurrences
text="one two one three one"
echo ${text//one/ONE}  # Output: ONE two ONE three ONE
```

## Environment Variables

Environment variables affect the behavior of the shell and programs:

```bash
# Common environment variables
echo $PATH    # Command search path
echo $LANG    # Current language
echo $TERM    # Terminal type
echo $SHELL   # Current shell

# Set an environment variable
export CUSTOM_VAR="my value"
```

To list all environment variables:

```bash
env
# or
printenv
```

To see all variables (including those not exported to the environment):

```bash
set
```

## Reading User Input

You can make your scripts interactive by reading input from users:

```bash
# Basic input
echo "What is your name?"
read name
echo "Hello, $name!"

# Read with a prompt
read -p "Enter your age: " age
echo "You are $age years old."

# Read secretly (for passwords)
read -sp "Enter password: " password
echo -e "\nPassword is $password"

# Read with timeout (5 seconds)
read -t 5 -p "Quick, enter something: " input
echo "You entered: $input"

# Read multiple values
read -p "Enter first and last name: " first last
echo "First name: $first, Last name: $last"
```

## Variable Expansion in Strings

Bash offers different ways to include variables in strings:

```bash
name="John"
age=30

# Double quotes allow variable expansion
echo "Name: $name, Age: $age"  # Output: Name: John, Age: 30

# Single quotes preserve literal text
echo 'Name: $name, Age: $age'  # Output: Name: $name, Age: $age

# Here documents for multi-line strings with variable expansion
cat <<EOT
User Profile:
--------------
Name: $name
Age: $age
EOT
```

Understanding variables is crucial for effective Bash scripting. They allow you to create dynamic, reusable scripts that can adapt to different inputs and conditions. In the next section, we'll explore control structures, which let you make decisions and create loops in your scripts.
