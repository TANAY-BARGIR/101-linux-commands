---
title: 'Getting Started with Python'
description: 'Set up your Python environment and write your first program'
order: 1
---

Before you can start coding in Python, you need to set up your development environment. This section will guide you through installing Python, choosing a code editor, and writing your first Python program.

## Installing Python

Python comes in two major versions: Python 2 and Python 3. Python 2 reached its end of life in 2020, so we'll be using Python 3 throughout this guide.

### For Windows

1. Visit the [Python downloads page](https://www.python.org/downloads/)
2. Download the latest Python 3 installer for Windows
3. Run the installer and make sure to check the box that says "Add Python to PATH"
4. Click "Install Now"

You can verify your installation by opening Command Prompt and typing:

```bash
python --version
```

You should see something like `Python 3.11.x` (the exact version may differ).

### For macOS

macOS usually comes with Python pre-installed, but it might be an older version. To install the latest version:

1. Install [Homebrew](https://brew.sh/) if you don't have it already
2. Open Terminal and run:

```bash
brew install python
```

Verify your installation:

```bash
python3 --version
```

### For Linux

Most Linux distributions come with Python pre-installed. To ensure you have the latest version, run:

```bash
# For Debian/Ubuntu
sudo apt update
sudo apt install python3 python3-pip

# For Fedora
sudo dnf install python3 python3-pip

# For Arch Linux
sudo pacman -S python python-pip
```

Verify your installation:

```bash
python3 --version
```

## Choosing a Code Editor

While you can write Python code in any text editor, using a dedicated code editor or IDE (Integrated Development Environment) will make your coding experience much more pleasant. Here are some popular options:

### Visual Studio Code (VS Code)

VS Code is a lightweight, free, and powerful code editor with excellent Python support.

1. Download and install [VS Code](https://code.visualstudio.com/)
2. Open VS Code and install the Python extension from the Extensions marketplace

### PyCharm

PyCharm is a dedicated Python IDE with powerful features.

1. Download and install [PyCharm Community Edition](https://www.jetbrains.com/pycharm/download/) (free)
2. Follow the installation instructions for your OS

### Jupyter Notebooks

For interactive coding and data analysis:

```bash
pip install notebook
```

Then run:

```bash
jupyter notebook
```

## Your First Python Program

Now that you have Python installed and a code editor ready, let's write your first Python program.

1. Open your code editor
2. Create a new file called `hello.py`
3. Type the following code:

```python
# This is a comment - it doesn't affect the code
print("Hello, Python world!")  # This prints a message to the screen

# Let's add a little more to our first program
name = input("What's your name? ")  # Get input from the user
print(f"Nice to meet you, {name}!")  # Use an f-string to include the name in our message
```

4. Save the file
5. Run the program:
   - In VS Code: Right-click in the editor and select "Run Python File in Terminal"
   - In PyCharm: Right-click and select "Run 'hello'"
   - In Terminal/Command Prompt: Navigate to the directory containing your file and run `python hello.py`

You should see "Hello, Python world!" printed, followed by a prompt asking for your name. After entering your name, you'll see a personalized greeting.

## Understanding the Python Interactive Shell

Python provides an interactive shell (or REPL - Read-Evaluate-Print Loop) where you can run Python commands directly.

To access it:

- On Windows: Open Command Prompt and type `python`
- On macOS/Linux: Open Terminal and type `python3`

You'll see something like:

```
Python 3.11.0 (main, Oct 24 2022, 18:26:48)
[GCC 11.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

Now you can type Python code directly and see immediate results:

```python
>>> 2 + 2
4
>>> print("Hello from the interactive shell!")
Hello from the interactive shell!
>>> name = "Developer"
>>> print(f"Hello, {name}!")
Hello, Developer!
```

The interactive shell is great for testing small code snippets, experimenting with Python, and learning the language.

## Next Steps

Now that you have your Python environment set up and have written your first program, you're ready to dive deeper into Python programming. In the next section, we'll explore variables and data types, the building blocks of any Python program.

Happy coding!
