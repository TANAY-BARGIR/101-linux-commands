---
title: 'File Operations'
description: 'Learn how to read from and write to files in Python'
order: 7
---

Working with files is a common task in programming. Python provides simple and efficient ways to read from and write to files. In this section, you'll learn how to work with text and binary files, as well as formats like CSV and JSON.

## The Basics of File I/O

### Opening and Closing Files

The most basic way to work with files in Python is using the built-in `open()` function:

```python
# Open a file for reading
file = open('example.txt', 'r')  # 'r' for read mode

# Do something with the file...
content = file.read()
print(content)

# Close the file when you're done
file.close()
```

However, this approach requires you to remember to close the file, which can be error-prone. Instead, it's better to use the `with` statement, which automatically closes the file when you're done:

```python
# Using 'with' (recommended approach)
with open('example.txt', 'r') as file:
    content = file.read()
    print(content)

# The file is automatically closed when the 'with' block ends
```

### File Modes

The `open()` function takes a mode parameter that specifies how you want to use the file:

- `'r'`: Read mode (default)
- `'w'`: Write mode (creates a new file or truncates an existing one)
- `'a'`: Append mode (adds content to the end of the file)
- `'x'`: Exclusive creation mode (fails if the file already exists)
- `'b'`: Binary mode (used with other modes, e.g., `'rb'` for reading binary)
- `'t'`: Text mode (default, used with other modes, e.g., `'rt'` for reading text)
- `'+'`: Update mode (allows both reading and writing)

```python
# Read a text file
with open('example.txt', 'r') as file:
    content = file.read()

# Write to a text file (creates or overwrites the file)
with open('output.txt', 'w') as file:
    file.write('Hello, world!')

# Append to a text file
with open('log.txt', 'a') as file:
    file.write('New entry: ' + str(datetime.datetime.now()) + '\n')

# Read a binary file
with open('image.jpg', 'rb') as file:
    binary_data = file.read()

# Write to a binary file
with open('copy.jpg', 'wb') as file:
    file.write(binary_data)
```

## Reading Files

There are several ways to read the contents of a file:

### Reading the Entire File

```python
# Read the entire file as a single string
with open('example.txt', 'r') as file:
    content = file.read()
    print(content)
```

### Reading Line by Line

```python
# Read the file line by line
with open('example.txt', 'r') as file:
    for line in file:
        print(line, end='')  # The line already includes a newline character
```

### Reading All Lines Into a List

```python
# Read all lines into a list
with open('example.txt', 'r') as file:
    lines = file.readlines()
    print(lines)  # ['First line\n', 'Second line\n', 'Third line\n']

# Process the list of lines
for line in lines:
    print(line.strip())  # Strip removes whitespace, including newlines
```

### Reading Specific Amounts

```python
# Read a specific number of characters
with open('example.txt', 'r') as file:
    first_10_chars = file.read(10)
    print(first_10_chars)

    # Read the next 10 characters
    next_10_chars = file.read(10)
    print(next_10_chars)
```

### Reading Line by Line Using `readline()`

```python
# Read lines one at a time using readline()
with open('example.txt', 'r') as file:
    line1 = file.readline()
    line2 = file.readline()
    print(line1, end='')
    print(line2, end='')
```

## Writing to Files

### Writing Strings

```python
# Write a string to a file
with open('output.txt', 'w') as file:
    file.write('Hello, world!\n')
    file.write('This is a second line.\n')
```

### Writing Multiple Lines

```python
# Write multiple lines at once
lines = ['First line\n', 'Second line\n', 'Third line\n']
with open('output.txt', 'w') as file:
    file.writelines(lines)
```

### Appending to Files

```python
# Append to a file
with open('log.txt', 'a') as file:
    file.write('Log entry at ' + str(datetime.datetime.now()) + '\n')
```

## Working with File Paths

When working with files, you often need to manipulate file paths. Python's `os.path` module provides functions for this:

```python
import os

# Join path components
path = os.path.join('folder', 'subfolder', 'file.txt')
print(path)  # 'folder/subfolder/file.txt' on Unix, 'folder\\subfolder\\file.txt' on Windows

# Get the directory name
dirname = os.path.dirname(path)
print(dirname)  # 'folder/subfolder'

# Get the file name
filename = os.path.basename(path)
print(filename)  # 'file.txt'

# Split into directory and file
dir_path, file_name = os.path.split(path)
print(dir_path, file_name)  # 'folder/subfolder', 'file.txt'

# Check if a path exists
exists = os.path.exists('example.txt')
print(exists)  # True or False

# Check if it's a file
is_file = os.path.isfile('example.txt')
print(is_file)  # True or False

# Check if it's a directory
is_dir = os.path.isdir('folder')
print(is_dir)  # True or False

# Get the absolute path
abs_path = os.path.abspath('example.txt')
print(abs_path)
```

For more advanced file path operations, the newer `pathlib` module provides an object-oriented approach:

```python
from pathlib import Path

# Create a Path object
path = Path('folder') / 'subfolder' / 'file.txt'
print(path)

# Check if it exists
print(path.exists())

# Get parts of the path
print(path.parent)  # The parent directory
print(path.name)    # The file name
print(path.stem)    # The file name without extension
print(path.suffix)  # The file extension

# Create directories
path.parent.mkdir(parents=True, exist_ok=True)

# List all .txt files in a directory
txt_files = list(Path('folder').glob('*.txt'))
for file in txt_files:
    print(file)
```

## Working with Common File Formats

### CSV Files

CSV (Comma-Separated Values) is a common format for tabular data. Python's `csv` module makes it easy to work with CSV files:

```python
import csv

# Write data to a CSV file
data = [
    ['Name', 'Age', 'City'],
    ['Alice', 30, 'New York'],
    ['Bob', 25, 'Los Angeles'],
    ['Charlie', 35, 'Chicago']
]

with open('people.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(data)

# Read data from a CSV file
with open('people.csv', 'r', newline='') as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)

# Using column names with DictReader and DictWriter
data = [
    {'Name': 'Alice', 'Age': 30, 'City': 'New York'},
    {'Name': 'Bob', 'Age': 25, 'City': 'Los Angeles'},
    {'Name': 'Charlie', 'Age': 35, 'City': 'Chicago'}
]

# Write data using DictWriter
with open('people_dict.csv', 'w', newline='') as file:
    fieldnames = ['Name', 'Age', 'City']
    writer = csv.DictWriter(file, fieldnames=fieldnames)

    writer.writeheader()  # Write the header row
    writer.writerows(data)

# Read data using DictReader
with open('people_dict.csv', 'r', newline='') as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row['Name'], row['Age'], row['City'])
```

### JSON Files

JSON (JavaScript Object Notation) is a popular format for storing and exchanging structured data. Python's `json` module makes it easy to work with JSON:

```python
import json

# Python data (a dictionary)
data = {
    'name': 'Alice',
    'age': 30,
    'city': 'New York',
    'languages': ['Python', 'JavaScript', 'Go'],
    'is_developer': True
}

# Write JSON to a file
with open('person.json', 'w') as file:
    json.dump(data, file, indent=4)  # indent for pretty-printing

# Read JSON from a file
with open('person.json', 'r') as file:
    loaded_data = json.load(file)
    print(loaded_data)
    print(loaded_data['name'])
    print(loaded_data['languages'][0])

# Convert Python object to JSON string
json_string = json.dumps(data, indent=4)
print(json_string)

# Parse JSON string to Python object
parsed_data = json.loads(json_string)
print(parsed_data)
```

## Error Handling When Working with Files

When working with files, various errors can occur. It's important to handle these errors to make your code robust:

```python
try:
    with open('non_existent_file.txt', 'r') as file:
        content = file.read()
        print(content)
except FileNotFoundError:
    print("The file doesn't exist.")
except PermissionError:
    print("You don't have permission to read this file.")
except IsADirectoryError:
    print("This is a directory, not a file.")
except Exception as e:
    print(f"An error occurred: {e}")
```

## Working with Temporary Files

For temporary files that only need to exist for a short time, Python's `tempfile` module is useful:

```python
import tempfile

# Create a temporary file
with tempfile.TemporaryFile('w+') as temp:
    # Write to the temporary file
    temp.write('Hello, temporary world!')

    # Go back to the beginning of the file
    temp.seek(0)

    # Read from the temporary file
    content = temp.read()
    print(content)

# The file is automatically deleted when the 'with' block ends

# Create a named temporary file
with tempfile.NamedTemporaryFile('w+') as named_temp:
    print(f"Temporary file name: {named_temp.name}")
    named_temp.write('This is a named temporary file.')
    named_temp.seek(0)
    print(named_temp.read())

# Create a temporary directory
with tempfile.TemporaryDirectory() as temp_dir:
    print(f"Temporary directory: {temp_dir}")
    # Use the temporary directory...
```

## File Compression

Python's `gzip`, `zipfile`, and other modules allow you to work with compressed files:

### Working with gzip Files

```python
import gzip

# Write compressed data
with gzip.open('data.txt.gz', 'wt') as f:
    f.write('Hello, compressed world!')

# Read compressed data
with gzip.open('data.txt.gz', 'rt') as f:
    content = f.read()
    print(content)
```

### Working with ZIP Archives

```python
import zipfile

# Create a ZIP archive
with zipfile.ZipFile('archive.zip', 'w') as zip_file:
    # Add files to the archive
    zip_file.write('example.txt')
    zip_file.write('data.csv')

# Extract all files from a ZIP archive
with zipfile.ZipFile('archive.zip', 'r') as zip_file:
    zip_file.extractall('extracted_files')

# List the contents of a ZIP archive
with zipfile.ZipFile('archive.zip', 'r') as zip_file:
    print(zip_file.namelist())

# Read a specific file from a ZIP archive
with zipfile.ZipFile('archive.zip', 'r') as zip_file:
    with zip_file.open('example.txt') as file:
        content = file.read()
        print(content)
```

## Practical Example: Log File Analyzer

Let's create a practical example that analyzes a log file to extract useful information:

```python
"""
Log File Analyzer

This script analyzes a log file to extract information about errors
and generate a report.
"""

import re
import csv
from datetime import datetime
from collections import Counter
from pathlib import Path

def parse_log_line(line):
    """Parse a log line and extract timestamp, level, and message."""
    # Example log format: [2023-05-21 14:23:45] [ERROR] Failed to connect to database
    pattern = r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(\w+)\] (.+)'
    match = re.match(pattern, line)

    if match:
        timestamp_str, level, message = match.groups()
        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
        return {
            'timestamp': timestamp,
            'level': level,
            'message': message
        }

    return None

def analyze_log_file(log_file_path):
    """Analyze the log file and return statistics."""
    # Check if the file exists
    log_path = Path(log_file_path)
    if not log_path.exists():
        return None

    # Initialize counters and data structures
    level_counts = Counter()
    errors = []
    first_timestamp = None
    last_timestamp = None

    # Process the log file
    with open(log_path, 'r') as file:
        for line_num, line in enumerate(file, 1):
            line = line.strip()
            if not line:
                continue

            parsed = parse_log_line(line)
            if not parsed:
                print(f"Warning: Could not parse line {line_num}: {line}")
                continue

            # Update first and last timestamps
            if first_timestamp is None or parsed['timestamp'] < first_timestamp:
                first_timestamp = parsed['timestamp']
            if last_timestamp is None or parsed['timestamp'] > last_timestamp:
                last_timestamp = parsed['timestamp']

            # Update level counter
            level_counts[parsed['level']] += 1

            # Store errors for the report
            if parsed['level'] == 'ERROR':
                errors.append({
                    'timestamp': parsed['timestamp'],
                    'message': parsed['message'],
                    'line_number': line_num
                })

    # Return the analysis results
    return {
        'total_lines': line_num,
        'level_counts': level_counts,
        'errors': sorted(errors, key=lambda x: x['timestamp']),
        'start_time': first_timestamp,
        'end_time': last_timestamp,
        'duration': last_timestamp - first_timestamp if first_timestamp and last_timestamp else None
    }

def generate_report(analysis, output_dir):
    """Generate reports based on the log analysis."""
    if not analysis:
        print("No analysis data to report.")
        return

    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate text summary
    with open(output_path / 'summary.txt', 'w') as file:
        file.write("Log Analysis Summary\n")
        file.write("===================\n\n")

        file.write(f"Total lines processed: {analysis['total_lines']}\n")
        file.write(f"Time span: {analysis['start_time']} to {analysis['end_time']}\n")
        file.write(f"Duration: {analysis['duration']}\n\n")

        file.write("Log Level Counts:\n")
        for level, count in analysis['level_counts'].items():
            file.write(f"  {level}: {count}\n")

        error_count = len(analysis['errors'])
        file.write(f"\nTotal Errors: {error_count}\n")

    # Generate CSV file with errors
    if analysis['errors']:
        with open(output_path / 'errors.csv', 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['Timestamp', 'Message', 'Line Number'])

            for error in analysis['errors']:
                writer.writerow([
                    error['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                    error['message'],
                    error['line_number']
                ])

    print(f"Reports generated in {output_path}")

def main():
    """Main function to run the log analyzer."""
    print("Log File Analyzer")
    print("================")

    log_file = input("Enter the path to the log file: ")
    output_dir = input("Enter the output directory for reports: ")

    print(f"\nAnalyzing log file: {log_file}...")
    analysis = analyze_log_file(log_file)

    if analysis:
        print("Analysis complete.")
        generate_report(analysis, output_dir)
    else:
        print(f"Error: Could not analyze log file '{log_file}'.")

if __name__ == "__main__":
    main()
```

To use this example, you'll need a log file in the format `[YYYY-MM-DD HH:MM:SS] [LEVEL] Message`. You can create a sample log file or adapt the script to match your log format.

This example demonstrates:

1. Reading and processing text files line by line
2. Using regular expressions to parse structured text
3. Writing output to different file formats (text and CSV)
4. Working with file paths using the `pathlib` module
5. Error handling for file operations
6. Using the `datetime` module to work with timestamps
7. Generating reports based on file analysis

## Next Steps

You now have a solid understanding of file operations in Python. You can read from and write to files in various formats, handle errors gracefully, and work with file paths across different operating systems.

In the next section, we'll explore error handling in more depth, how to anticipate, catch, and handle exceptions to make your Python programs more robust and user-friendly.

Happy coding!
