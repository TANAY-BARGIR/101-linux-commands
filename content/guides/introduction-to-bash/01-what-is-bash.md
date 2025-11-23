---
title: 'What is Bash?'
description: "Understand what Bash is, its history, and why it's a crucial tool for developers and system administrators"
order: 1
---

Bash, which stands for "Bourne Again SHell," is much more than just a command prompt. It's a complete command language interpreter that provides an interface between you and the operating system.

## Bash's Origin and History

Bash was created by Brian Fox for the GNU Project as a free software replacement for the Bourne shell (sh). Released in 1989, it has evolved to become the default shell for most Linux distributions and macOS (until Catalina, which switched to zsh as the default).

The name is a play on the earlier Bourne shell, created by Stephen Bourne at Bell Labs in the late 1970s, signifying that Bash is an enhanced, "born again" version of this earlier shell.

## Why Bash Matters

So why should you care about Bash? There are several compelling reasons:

1. **Ubiquity**: Bash is everywhere in the Unix/Linux world. If you work with servers, cloud infrastructure, or any Unix-based system, you'll inevitably encounter Bash.

2. **Automation**: Bash allows you to automate repetitive tasks by writing scripts that can execute a series of commands.

3. **System Administration**: For system administrators, Bash is an essential tool for monitoring systems, managing services, and maintaining servers.

4. **Development Workflow**: Developers use Bash to build software, run tests, and deploy applications.

5. **Customization**: Bash allows you to customize your environment to suit your workflow.

## Bash vs. Other Shells

While Bash is the most common shell, it's not the only one. Other popular shells include:

- **sh** (Bourne Shell) - The original Unix shell
- **zsh** (Z Shell) - A more modern shell with advanced features
- **fish** - A user-friendly shell with a focus on interactivity
- **dash** - A lightweight shell often used for scripting

Bash strikes a balance between features and simplicity, which is why it has remained popular for decades. It's compatible with sh while adding numerous improvements.

## Your First Bash Command

Let's run a simple command to verify that you're using Bash. Open your terminal and type:

```bash
echo $SHELL
```

This command prints the path to the shell you're currently using. If you see `/bin/bash` or something similar containing "bash," you're running Bash.

To check the version of Bash you're using, run:

```bash
bash --version
```

This will display the version number and other information about your Bash installation.

## Interactive vs. Script Mode

Bash operates in two primary modes:

1. **Interactive Mode**: When you open a terminal and see a prompt waiting for your commands, you're using Bash in interactive mode. Each command is executed as soon as you press Enter.

2. **Script Mode**: When Bash reads commands from a file (a script), it's running in script mode. This allows you to write a series of commands that will be executed sequentially.

Here's a simple example of creating and running a basic Bash script:

```bash
# Create a file named hello.sh
echo '#!/bin/bash
echo "Hello, world!"' > hello.sh

# Make it executable
chmod +x hello.sh

# Run it
./hello.sh
```

This script should output "Hello, world!" when executed.

## Terminal vs. Shell: Understanding the Difference

Many newcomers confuse terminals and shells, but they're distinct components:

- A **terminal** (or terminal emulator) is a program that provides a text-based interface. Examples include GNOME Terminal, iTerm2, and Windows Terminal.
- A **shell** is the command interpreter that runs inside the terminal. Bash is one such shell.

Think of the terminal as the window and the shell as the program running inside that window, interpreting your commands.

Now that you understand what Bash is and why it's valuable, we're ready to dive deeper into Bash basics in the next section.
