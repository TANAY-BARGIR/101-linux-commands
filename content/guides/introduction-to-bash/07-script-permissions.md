---
title: 'Script Permissions and Execution'
description: 'Learn how to set the right permissions, make scripts executable, and understand different ways to run Bash scripts'
order: 7
---

Understanding how to properly set permissions and execute Bash scripts is crucial for any script writer. In this section, we'll explore everything you need to know about script permissions, execution methods, and the security implications of different approaches.

## File Permissions Basics

In Unix-like systems, every file and directory has a set of permissions that determine who can read, write, or execute it. These permissions are divided into three categories:

- **Owner**: The user who created the file
- **Group**: A set of users with specific privileges
- **Others**: Everyone else

Each category can have three possible permissions:

- **Read (r)**: Allows viewing the file content
- **Write (w)**: Allows modifying the file
- **Execute (x)**: Allows running the file as a program

## Viewing File Permissions

To view the permissions of a file, use the `ls -l` command:

```bash
ls -l script.sh
```

The output will look something like this:

```
-rw-r--r-- 1 user group 1024 May 17 10:30 script.sh
```

The first ten characters represent the file type and permissions:

- First character: File type (`-` for regular file, `d` for directory)
- Characters 2-4: Owner permissions (`rw-` means read and write, no execute)
- Characters 5-7: Group permissions (`r--` means read-only)
- Characters 8-10: Others permissions (`r--` means read-only)

## Changing File Permissions

To make a script executable, you need to add the execute permission. The `chmod` command is used to change file permissions:

```bash
# Add execute permission for the owner only
chmod u+x script.sh

# Add execute permission for everyone
chmod +x script.sh

# Set specific permissions (read/write/execute for owner, read/execute for group and others)
chmod 755 script.sh
```

The numeric notation (like `755`) represents permissions in octal format:

- First digit (`7`): Owner permissions (4=read + 2=write + 1=execute)
- Second digit (`5`): Group permissions (4=read + 0=no write + 1=execute)
- Third digit (`5`): Others permissions (4=read + 0=no write + 1=execute)

Common permission patterns for scripts:

- `700`: Only the owner can read, write, and execute (most restrictive)
- `755`: Owner can read, write, and execute; group and others can read and execute
- `775`: Owner and group can read, write, and execute; others can read and execute
- `777`: Everyone can read, write, and execute (least secure, avoid if possible)

## Making Scripts Executable

For a script to be executable, you need two things:

1. The execute permission, as we just discussed
2. A proper shebang line at the beginning of the script

The shebang line specifies which interpreter should execute the script:

```bash
#!/bin/bash
# The rest of your script...
```

This tells the system to use `/bin/bash` to interpret the script.

Different shells or interpreters may be specified:

```bash
#!/bin/sh        # POSIX-compliant shell
#!/usr/bin/env bash  # Find bash in PATH (more portable)
#!/usr/bin/python    # Python script
#!/usr/bin/perl      # Perl script
```

The `#!/usr/bin/env` approach is particularly useful for portability across different systems, as it searches for the interpreter in the user's PATH.

## Different Ways to Execute Bash Scripts

There are several ways to execute a Bash script, each with different implications:

### 1. Direct Execution (requires execute permission)

```bash
./script.sh
```

This runs the script as an executable file. The script must have execute permissions, and the shebang line determines the interpreter.

### 2. Using bash Explicitly

```bash
bash script.sh
```

This explicitly invokes the bash interpreter on the script file. The script doesn't need execute permissions, and the shebang line is ignored since you're directly specifying the interpreter.

### 3. Source the Script

```bash
source script.sh
# or
. script.sh  # Shorthand notation
```

This executes the script in the current shell environment rather than in a new subshell. This means:

- Variables set in the script remain available after the script finishes
- The `exit` command in the script will exit your current shell
- The script doesn't need execute permissions

This method is commonly used for loading functions or environment variables.

## Script Execution Context

Understanding the execution context of your script is important:

### Subshell vs. Current Shell

When you run a script using `./script.sh` or `bash script.sh`, it runs in a subshell:

- Variables set in the script are not available after the script finishes
- Changes to the working directory don't affect the parent shell
- The `exit` command only exits the script, not your terminal session

When you source a script using `source script.sh` or `. script.sh`, it runs in the current shell:

- Variables remain available
- Directory changes persist
- The `exit` command will exit your current shell

Here's a simple demonstration:

```bash
# Create a test script
cat > test_vars.sh << 'EOF'
#!/bin/bash
TEST_VAR="This is a test"
echo "Inside script: TEST_VAR=$TEST_VAR"
cd /tmp
echo "Inside script: PWD=$PWD"
EOF

chmod +x test_vars.sh

# Run as executable
./test_vars.sh
echo "After running: TEST_VAR=$TEST_VAR"
echo "After running: PWD=$PWD"

# Source the script
source test_vars.sh
echo "After sourcing: TEST_VAR=$TEST_VAR"
echo "After sourcing: PWD=$PWD"
```

### Environment Variables and Subshells

By default, when you create a variable in a shell, it is local to that shell and not passed to child processes:

```bash
MY_VAR="Hello"
bash -c 'echo $MY_VAR'  # Output: (empty)
```

To make a variable available to child processes, you need to export it:

```bash
export MY_VAR="Hello"
bash -c 'echo $MY_VAR'  # Output: Hello
```

## Running Scripts in Different Modes

You can control how Bash interprets and executes your scripts with special options:

### Debugging Mode

To run a script in debugging mode, which prints each command before execution:

```bash
bash -x script.sh
```

Alternatively, you can enable debugging for portions of your script:

```bash
#!/bin/bash

# Regular execution
echo "This is normal output"

# Start debugging
set -x
echo "This command is shown before execution"
for i in {1..3}; do
    echo "Loop iteration $i"
done
# Stop debugging
set +x

echo "Back to normal output"
```

### Error Handling Modes

Bash provides several modes to handle errors:

```bash
# Exit immediately if a command fails
set -e

# Treat unset variables as an error
set -u

# Exit if any command in a pipe fails (not just the last one)
set -o pipefail

# Combine all three
set -euo pipefail
```

You can add these settings at the beginning of your script for more robust error handling.

## Finding and Using Interpreters

The system needs to find your interpreter (like `/bin/bash`) to execute your script. This can be different across systems, which is why the `#!/usr/bin/env` approach is useful:

```bash
#!/usr/bin/env bash
```

This searches the user's PATH for `bash`, making your script more portable.

To find where an interpreter is located:

```bash
which bash
# or
type -P bash
```

## Script Execution Permissions in Practice

Let's put this all together with a practical example:

```bash
#!/bin/bash

# First, create a simple script
cat > hello.sh << 'EOF'
#!/bin/bash
echo "Hello from a shell script!"
current_time=$(date)
echo "Current time: $current_time"
EOF

# Check initial permissions
echo "Initial permissions:"
ls -l hello.sh

# Try to execute without execute permission
echo -e "\nTrying to execute without execute permission:"
./hello.sh 2>&1 || echo "Failed to execute"

# Add execute permission
echo -e "\nAdding execute permission:"
chmod +x hello.sh
ls -l hello.sh

# Execute with direct method
echo -e "\nExecuting with ./hello.sh:"
./hello.sh

# Execute by calling bash
echo -e "\nExecuting with bash hello.sh:"
bash hello.sh

# Create a script to demonstrate sourcing
cat > vars.sh << 'EOF'
#!/bin/bash
TEST_VAR="This variable was set in the script"
echo "Inside script: TEST_VAR is set"
EOF

chmod +x vars.sh

# Execute normally
echo -e "\nExecuting vars.sh normally:"
./vars.sh
echo "After normal execution, TEST_VAR='$TEST_VAR'"

# Source the script
echo -e "\nSourceing vars.sh:"
source vars.sh
echo "After sourcing, TEST_VAR='$TEST_VAR'"
```

## Security Considerations

When working with script permissions, keep these security considerations in mind:

1. **Avoid 777 permissions**: Don't give everyone write access to your scripts, as this allows anyone to modify them.

2. **Be careful with setuid/setgid**: These special permissions (set with `chmod u+s` or `chmod g+s`) allow a script to run with the privileges of the owner or group, which can be a security risk.

3. **Consider umask settings**: The default permissions for new files are determined by your umask value. A typical value is `022`, which means new files get `644` (rw-r--r--) permissions.

4. **Beware of path injection**: When executing commands in scripts, especially with `eval` or when using variables in paths, be careful of potential injection attacks.

5. **Check script sources**: Before executing scripts downloaded from the internet, review them to ensure they don't contain malicious code.

6. **Use restricted environments**: For sensitive scripts, consider using restricted shells or containers to limit potential damage.

## Running Scripts on System Startup

To run scripts automatically when your system starts:

### Using cron

```bash
# Edit your crontab
crontab -e

# Add a line to run a script at reboot
@reboot /path/to/script.sh
```

### Using systemd (on modern Linux distributions)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/myscript.service
```

Add content:

```
[Unit]
Description=My Bash Script Service
After=network.target

[Service]
Type=simple
ExecStart=/path/to/script.sh
User=yourusername

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable myscript.service
sudo systemctl start myscript.service
```

## Troubleshooting Permission Issues

Common permission-related issues and their solutions:

### "Permission denied" when trying to execute

```bash
# Make the script executable
chmod +x script.sh

# Check if the filesystem allows execution (some network filesystems don't)
# If necessary, copy to a local filesystem

# Check if the script has DOS line endings
file script.sh  # Look for "CRLF" in the output
dos2unix script.sh  # Convert if needed
```

### "Command not found" error

```bash
# Make sure the shebang path is correct
which bash
# Edit the script if necessary to use the correct path

# Use the env approach for better portability
#!/usr/bin/env bash
```

### Script runs differently when executed vs. sourced

```bash
# Remember: sourced scripts run in the current shell environment
# Check for differences in environment variables, working directory, etc.

# Add debugging to see what's happening
set -x
```

Understanding script permissions and execution methods is fundamental to working effectively with Bash. With this knowledge, you'll be able to create scripts that can be executed reliably across different environments and by different users. In the next section, we'll explore how to handle command-line arguments in your scripts, making them more flexible and user-friendly.
