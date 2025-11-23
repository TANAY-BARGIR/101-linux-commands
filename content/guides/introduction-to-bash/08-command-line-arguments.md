---
title: 'Command Line Arguments'
description: 'Learn how to accept and process command-line arguments to create flexible and user-friendly Bash scripts'
order: 8
---

Command-line arguments allow users to pass information to your script when they run it. Learning to handle these arguments effectively will make your scripts more flexible and user-friendly. In this section, we'll explore how to accept, validate, and process arguments in Bash scripts.

## Basic Argument Handling

In Bash, command-line arguments are accessible through special variables:

- `$0`: The name of the script itself
- `$1`, `$2`, `$3`, etc.: The first, second, third arguments, and so on
- `$@`: All arguments as separate strings
- `$*`: All arguments as a single string
- `$#`: The number of arguments

Here's a simple example:

```bash
#!/bin/bash

echo "Script name: $0"
echo "First argument: $1"
echo "Second argument: $2"
echo "Number of arguments: $#"
echo "All arguments: $@"
```

If you save this as `args.sh` and run it with:

```bash
./args.sh hello world
```

You'll get output like:

```
Script name: ./args.sh
First argument: hello
Second argument: world
Number of arguments: 2
All arguments: hello world
```

## Checking for Required Arguments

To ensure your script receives the necessary arguments, you can check `$#`:

```bash
#!/bin/bash

if [ $# -lt 2 ]; then
    echo "Error: Not enough arguments"
    echo "Usage: $0 <source> <destination>"
    exit 1
fi

source_file=$1
destination_file=$2

echo "Copying from $source_file to $destination_file"
# cp "$source_file" "$destination_file"
```

This script expects at least two arguments and exits with an error message if they're not provided.

## Iterating Through Arguments

You can process all arguments with a loop:

```bash
#!/bin/bash

echo "Processing all arguments:"

# Method 1: Using $@
for arg in "$@"; do
    echo "- $arg"
done

# Method 2: Using a counter
echo "Processing with index:"
for ((i=1; i<=$#; i++)); do
    arg=${!i}
    echo "$i: $arg"
done
```

## Shifting Arguments

The `shift` command moves the argument positions down, so `$2` becomes `$1`, `$3` becomes `$2`, and so on:

```bash
#!/bin/bash

echo "Before shift: $1 $2 $3"

shift

echo "After shift: $1 $2 $3"

# Shift multiple positions
shift 2

echo "After shift 2: $1 $2 $3"
```

This is useful for processing arguments one by one:

```bash
#!/bin/bash

echo "Processing arguments:"

while [ $# -gt 0 ]; do
    echo "- $1"
    shift
done
```

## Default Values for Arguments

You can provide default values for optional arguments:

```bash
#!/bin/bash

# Default values
output_file=${2:-"output.txt"}

echo "Input file: $1"
echo "Output file: $output_file"
```

The syntax `${variable:-default}` means "use the value of `variable` if it's set, otherwise use `default`".

## Named Arguments and Flags

For more complex scripts, you might want to support named arguments or flags:

```bash
#!/bin/bash

verbose=false
output_file="output.txt"

# Parse options
while getopts ":vo:" option; do
    case $option in
        v)
            verbose=true
            ;;
        o)
            output_file=$OPTARG
            ;;
        \?)
            echo "Error: Invalid option -$OPTARG"
            exit 1
            ;;
        :)
            echo "Error: Option -$OPTARG requires an argument"
            exit 1
            ;;
    esac
done

# Skip processed options to access remaining arguments
shift $((OPTIND - 1))

# Now $1 is the first non-option argument
input_file=$1

if [ -z "$input_file" ]; then
    echo "Error: Input file is required"
    echo "Usage: $0 [-v] [-o output_file] input_file"
    exit 1
fi

# Use the arguments
echo "Input file: $input_file"
echo "Output file: $output_file"
echo "Verbose mode: $verbose"

if $verbose; then
    echo "Running in verbose mode"
fi
```

This script accepts:

- `-v`: A flag to enable verbose mode
- `-o file`: An option to specify the output file
- A required input file argument

You would run it like:

```bash
./script.sh -v -o custom.txt input.txt
```

## Using getopt for Advanced Option Parsing

For even more complex option parsing, especially with long options (like `--verbose`), you can use the `getopt` command:

```bash
#!/bin/bash

# Define default values
verbose=false
output_file="output.txt"
count=1

# Define help function
show_help() {
    echo "Usage: $0 [options] input_file"
    echo "Options:"
    echo "  -v, --verbose       Enable verbose output"
    echo "  -o, --output FILE   Specify output file (default: output.txt)"
    echo "  -c, --count NUMBER  Specify count (default: 1)"
    echo "  -h, --help          Show this help message"
}

# Parse options
TEMP=$(getopt -o "vo:c:h" --long "verbose,output:,count:,help" -n "$0" -- "$@")
if [ $? -ne 0 ]; then
    echo "Error: Invalid options"
    show_help
    exit 1
fi

# Reset positional parameters
eval set -- "$TEMP"

# Process options
while true; do
    case "$1" in
        -v|--verbose)
            verbose=true
            shift
            ;;
        -o|--output)
            output_file="$2"
            shift 2
            ;;
        -c|--count)
            count="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Error: Internal error!"
            exit 1
            ;;
    esac
done

# Check for required input file
if [ $# -lt 1 ]; then
    echo "Error: Input file is required"
    show_help
    exit 1
fi

input_file="$1"

# Use the arguments
echo "Input file: $input_file"
echo "Output file: $output_file"
echo "Count: $count"
echo "Verbose mode: $verbose"

if $verbose; then
    echo "Running in verbose mode"
fi
```

This script handles both short options (`-v`, `-o`) and long options (`--verbose`, `--output`). You can run it with:

```bash
./script.sh --verbose --output=custom.txt --count=5 input.txt
# or
./script.sh -v -o custom.txt -c 5 input.txt
```

## Validating Arguments

Always validate user input to prevent errors or security issues:

```bash
#!/bin/bash

# Check if the number of arguments is correct
if [ $# -ne 2 ]; then
    echo "Error: Expected exactly 2 arguments"
    echo "Usage: $0 <age> <name>"
    exit 1
fi

age=$1
name=$2

# Validate age (must be a number)
if ! [[ "$age" =~ ^[0-9]+$ ]]; then
    echo "Error: Age must be a number"
    exit 1
fi

# Validate name (must be alphabetic)
if ! [[ "$name" =~ ^[a-zA-Z]+$ ]]; then
    echo "Error: Name must contain only letters"
    exit 1
fi

echo "Hello, $name! You are $age years old."
```

## Practical Examples

Let's look at some practical examples of command-line argument handling:

### Example 1: File Processing Script

```bash
#!/bin/bash

show_usage() {
    echo "Usage: $0 [options] input_file [input_file2 ...]"
    echo "Options:"
    echo "  -o, --output FILE   Output file (default: output.txt)"
    echo "  -f, --format FMT    Output format: text, csv, json (default: text)"
    echo "  -v, --verbose       Enable verbose mode"
    echo "  -h, --help          Show this help message"
}

# Default values
output_file="output.txt"
format="text"
verbose=false

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        -o|--output)
            if [ -z "$2" ] || [ "${2:0:1}" = "-" ]; then
                echo "Error: Option $1 requires an argument"
                exit 1
            fi
            output_file="$2"
            shift 2
            ;;
        --output=*)
            output_file="${1#*=}"
            shift
            ;;
        -f|--format)
            if [ -z "$2" ] || [ "${2:0:1}" = "-" ]; then
                echo "Error: Option $1 requires an argument"
                exit 1
            fi
            format="$2"
            shift 2
            ;;
        --format=*)
            format="${1#*=}"
            shift
            ;;
        -v|--verbose)
            verbose=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Error: Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Check for input files
if [ $# -lt 1 ]; then
    echo "Error: No input files specified"
    show_usage
    exit 1
fi

# Validate format
case "$format" in
    text|csv|json)
        # Valid format
        ;;
    *)
        echo "Error: Invalid format: $format"
        echo "Valid formats: text, csv, json"
        exit 1
        ;;
esac

# Process files
echo "Processing files: $@"
echo "Output file: $output_file"
echo "Format: $format"
if $verbose; then
    echo "Verbose mode enabled"
fi

# Create or truncate the output file
> "$output_file"

# Process each input file
for file in "$@"; do
    if [ ! -f "$file" ]; then
        echo "Warning: File not found: $file"
        continue
    fi

    if $verbose; then
        echo "Processing file: $file"
    fi

    # Example processing
    case "$format" in
        text)
            echo "--- Content of $file ---" >> "$output_file"
            cat "$file" >> "$output_file"
            echo "" >> "$output_file"
            ;;
        csv)
            # Example: Convert spaces to commas
            cat "$file" | tr ' ' ',' >> "$output_file"
            ;;
        json)
            # Example: Wrap in JSON format
            echo "{ \"filename\": \"$file\", \"content\": \"" >> "$output_file"
            # Escape quotes and backslashes
            cat "$file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' >> "$output_file"
            echo "\" }" >> "$output_file"
            ;;
    esac
done

echo "Done! Output saved to $output_file"
```

This script processes multiple input files and outputs them in different formats.

### Example 2: Backup Script

```bash
#!/bin/bash

show_usage() {
    echo "Creates a backup of specified directories"
    echo "Usage: $0 [options] [directory1 directory2 ...]"
    echo "Options:"
    echo "  -d, --destination DIR  Backup destination directory (default: ./backup)"
    echo "  -n, --name NAME        Backup name (default: backup-YYYYMMDD)"
    echo "  -z, --compress         Compress the backup with gzip"
    echo "  -e, --exclude PATTERN  Exclude files/dirs matching PATTERN (can be used multiple times)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "If no directories are specified, the current directory will be backed up."
}

# Default values
backup_dest="./backup"
backup_name="backup-$(date +%Y%m%d)"
compress=false
exclude_patterns=()

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        -d|--destination)
            backup_dest="$2"
            shift 2
            ;;
        -n|--name)
            backup_name="$2"
            shift 2
            ;;
        -z|--compress)
            compress=true
            shift
            ;;
        -e|--exclude)
            exclude_patterns+=("$2")
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            echo "Error: Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# If no directories specified, use current directory
if [ $# -eq 0 ]; then
    directories=(".")
else
    directories=("$@")
fi

# Create destination directory if it doesn't exist
mkdir -p "$backup_dest"

# Build tar command
tar_cmd="tar -cf $backup_dest/$backup_name.tar"

# Add exclude patterns
for pattern in "${exclude_patterns[@]}"; do
    tar_cmd="$tar_cmd --exclude='$pattern'"
done

# Add source directories
for dir in "${directories[@]}"; do
    tar_cmd="$tar_cmd '$dir'"
done

# Execute tar command
echo "Creating backup..."
eval $tar_cmd

# Compress if requested
if $compress; then
    echo "Compressing backup..."
    gzip "$backup_dest/$backup_name.tar"
    echo "Backup created: $backup_dest/$backup_name.tar.gz"
else
    echo "Backup created: $backup_dest/$backup_name.tar"
fi
```

This script creates a backup of specified directories with various options.

## Best Practices for Command-Line Arguments

When designing your script's command-line interface:

1. **Provide helpful usage information**: Include a `--help` option and clear usage instructions.

2. **Follow conventions**: Use standard option formats (`-s` for short options, `--long` for long options).

3. **Be consistent**: If `-o` requires an argument, make all similar options consistent.

4. **Provide sensible defaults**: Make optional arguments truly optional with reasonable default values.

5. **Validate input**: Check that arguments have appropriate values before using them.

6. **Handle errors gracefully**: Give clear error messages when arguments are missing or invalid.

7. **Support common idioms**: If your script expects file paths, support `-` to mean stdin/stdout.

8. **Document your interface**: In both usage messages and comments, explain what each option does.

9. **Test edge cases**: Make sure your script handles unusual inputs correctly.

By learning command-line argument handling, you can create scripts that are both powerful and user-friendly. In the next section, we'll explore common Bash tools and utilities that will further enhance your scripting capabilities.
