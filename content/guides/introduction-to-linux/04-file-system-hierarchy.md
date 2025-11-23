---
title: 'Linux File System Hierarchy'
description: 'Understand how files are organized in Linux, file permissions, and how to work with the Linux file system efficiently.'
order: 4
---

One of the most important concepts to understand in Linux is how the file system is structured. Unlike Windows with its drive letters (C:, D:, etc.), Linux organizes all files in a single hierarchical directory structure, starting from a single root directory designated by a forward slash (`/`).

In this part, we'll explore the Linux file system layout, understand file permissions, and learn how to navigate and manage this structure effectively.

## The Filesystem Hierarchy Standard (FHS)

Most Linux distributions follow the Filesystem Hierarchy Standard (FHS), which defines the main directories and their contents. This standardization helps ensure consistency across different Linux systems.

Here's an overview of the most important directories:

### / (Root Directory)

The root directory is the top-level directory in the file system hierarchy. All other directories branch off from here, either directly or indirectly.

### /bin - Essential User Binaries

Contains essential executable programs (binaries) needed for basic system functionality, available to all users:

```bash
ls -la /bin | head
```

Key programs here include shells like `bash`, and core utilities like `ls`, `cp`, `mv`, and `rm`.

### /sbin - System Binaries

Contains system administration binaries, typically used by the root user:

```bash
ls -la /sbin | head
```

Includes programs for system maintenance, network configuration, and other administrative tasks.

### /etc - Configuration Files

Contains system-wide configuration files:

```bash
ls -la /etc | head
```

Important subdirectories and files:

- `/etc/passwd`: User account information
- `/etc/group`: Group definitions
- `/etc/fstab`: File system mount information
- `/etc/hosts`: Host-to-IP mappings
- `/etc/ssh/`: SSH configuration
- `/etc/sudoers`: sudo access rules

Most files here are plain text and can be edited with a text editor (though some require root privileges).

### /home - User Home Directories

Contains a subdirectory for each regular user, typically named after their username:

```bash
ls -la /home
```

Each user's home directory (e.g., `/home/username/`) stores their personal files, configurations, and data. When you see the tilde (`~`) in file paths, it refers to the current user's home directory.

### /root - Root User's Home

The home directory for the root user (system administrator):

```bash
ls -la /root
```

This is separate from regular users' home directories for security reasons.

### /var - Variable Data

Contains files that change during system operation:

```bash
ls -la /var
```

Important subdirectories:

- `/var/log/`: System and application log files
- `/var/spool/`: Printer and mail queues
- `/var/cache/`: Application cache data
- `/var/lib/`: Variable state information

Log files in `/var/log/` are particularly useful for troubleshooting:

```bash
ls -la /var/log
```

### /tmp - Temporary Files

A world-writable directory for temporary files:

```bash
ls -la /tmp
```

Files here may be deleted automatically when the system reboots or after a specified period.

### /usr - User Programs

Contains the majority of user and system programs, libraries, documentation, and other data:

```bash
ls -la /usr
```

Key subdirectories:

- `/usr/bin/`: User commands
- `/usr/sbin/`: System administration commands
- `/usr/lib/`: Libraries
- `/usr/share/`: Architecture-independent data
- `/usr/local/`: Locally installed software
- `/usr/include/`: Header files for compiling C programs

Historically, `/usr` stood for "Unix System Resources," though some now consider it "User System Resources."

### /opt - Optional Software

Contains add-on software packages:

```bash
ls -la /opt
```

Typically used by commercial software that doesn't follow the standard file system layout.

### /lib - Essential Shared Libraries

Contains libraries needed by programs in `/bin` and `/sbin`:

```bash
ls -la /lib | head
```

These libraries are essential for basic system functionality.

### /media and /mnt - Mount Points

Used for mounting file systems:

- `/media/`: For removable media (USB drives, CDs, etc.)
- `/mnt/`: For temporarily mounted file systems

```bash
ls -la /media
ls -la /mnt
```

### /dev - Device Files

Contains device files representing hardware devices:

```bash
ls -la /dev | head
```

Important device files:

- `/dev/sda`, `/dev/sdb`, etc.: Hard disks
- `/dev/tty*`: Terminal devices
- `/dev/null`: Discards all data written to it
- `/dev/zero`: Provides an endless stream of zeros
- `/dev/random` and `/dev/urandom`: Random number generators

### /proc - Process Information

A virtual file system providing information about processes and system status:

```bash
ls -la /proc | head
```

Contains numbered directories for each running process, plus special files with system information:

```bash
cat /proc/cpuinfo    # CPU information
cat /proc/meminfo    # Memory information
cat /proc/version    # Kernel version
```

### /sys - System Information

Another virtual file system exposing information about devices, drivers, and kernel features:

```bash
ls -la /sys | head
```

## File Permissions and Ownership

Linux uses a permission system to control who can read, write, or execute files.

### Understanding File Permissions

When you list files with `ls -l`, you'll see permission information:

```
-rwxrw-r-- 1 user group 4096 Jan 1 12:34 file.txt
```

The permissions are represented by the first 10 characters:

- Position 1: File type (`-` for regular file, `d` for directory, `l` for symbolic link)
- Positions 2-4: Owner permissions (`r` read, `w` write, `x` execute)
- Positions 5-7: Group permissions
- Positions 8-10: Others (everyone else) permissions

### Numeric Representation

Permissions can also be represented numerically:

- Read (r) = 4
- Write (w) = 2
- Execute (x) = 1

Add the values to get a single digit:

- 7 = read + write + execute (4+2+1)
- 6 = read + write (4+2)
- 5 = read + execute (4+1)
- 4 = read only (4)

A permission like `chmod 755 file` sets:

- Owner: 7 (rwx)
- Group: 5 (r-x)
- Others: 5 (r-x)

### Changing Permissions

Use `chmod` to change file permissions:

```bash
chmod 755 file.txt    # Set permissions using numeric mode
chmod u+x file.txt    # Add execute permission for user
chmod g-w file.txt    # Remove write permission from group
chmod o=r file.txt    # Set others permission to read-only
chmod a+x file.txt    # Add execute permission for all (user, group, others)
```

Examples of common permission patterns:

- `chmod 644 file.txt`: Regular file (user can read/write, others can read)
- `chmod 755 script.sh`: Script file (user can read/write/execute, others can read/execute)
- `chmod 600 private.key`: Private key file (user can read/write, no access for others)
- `chmod 775 directory`: Collaborative directory (full access for user/group, read/execute for others)

### Changing Ownership

Use `chown` to change file ownership:

```bash
chown user file.txt    # Change the owner
chown user:group file.txt    # Change both owner and group
chown :group file.txt    # Change only the group
```

Use `chgrp` to change just the group:

```bash
chgrp group file.txt
```

For recursive changes (affecting subdirectories and their contents), add the `-R` option:

```bash
chmod -R 755 directory/
chown -R user:group directory/
```

### Special Permissions

Beyond the basic read, write, and execute permissions, Linux has special permissions:

#### 1. setuid (Set User ID)

When set on an executable, it runs with the permissions of the file owner, not the user who runs it.

```bash
chmod u+s file    # Set the setuid bit
chmod 4755 file   # Numeric form (4 represents setuid)
```

Example: The `passwd` command has setuid permission, allowing regular users to update the password file (owned by root).

#### 2. setgid (Set Group ID)

For files: When executed, runs with the permissions of the file's group.
For directories: New files created in the directory inherit the directory's group.

```bash
chmod g+s directory/    # Set the setgid bit
chmod 2755 directory/   # Numeric form (2 represents setgid)
```

#### 3. sticky bit

When set on a directory, only the file owner, directory owner, or root can delete or rename files within it.

```bash
chmod +t directory/    # Set the sticky bit
chmod 1755 directory/  # Numeric form (1 represents sticky bit)
```

Example: The `/tmp` directory has the sticky bit set to prevent users from deleting each other's temporary files.

## File Types in Linux

Linux supports several types of files, indicated by the first character in the permissions string:

- `-`: Regular file
- `d`: Directory
- `l`: Symbolic link
- `c`: Character device
- `b`: Block device
- `p`: Named pipe
- `s`: Socket

### Regular Files

Most files you work with are regular files, containing data, text, or program code.

### Directories

Directories are special files that contain lists of other files and directories.

### Symbolic Links

Symbolic links (symlinks) are like shortcuts, pointing to another file or directory:

```bash
ln -s target_file link_name    # Create a symbolic link
```

Example:

```bash
ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/mysite
```

When you list a symbolic link with `ls -l`, you'll see something like:

```
lrwxrwxrwx 1 user group 8 Jan 1 12:34 link -> target
```

### Hard Links

Hard links create additional directory entries for the same file:

```bash
ln target_file link_name    # Create a hard link
```

Hard links share the same inode (file system reference) as the original file. You can't create hard links to directories or across file systems.

## Working with Hidden Files

In Linux, any file or directory whose name begins with a dot (`.`) is considered hidden:

```bash
ls -a    # Show all files, including hidden ones
```

Common hidden files and directories:

- `.bashrc`: Bash shell configuration
- `.profile`: Login shell configuration
- `.ssh/`: SSH keys and configuration
- `.config/`: Application configurations
- `.cache/`: Cached data

## Finding Files and Information

### Using `find` with File Attributes

The `find` command can search based on permissions, ownership, and other attributes:

```bash
# Find files owned by a specific user
find /home -user username

# Find files with specific permissions
find /home -perm 644

# Find files modified in the last 7 days
find /var/log -mtime -7

# Find files larger than 100MB
find / -size +100M
```

### Using `stat` for File Information

The `stat` command shows detailed file information:

```bash
stat file.txt
```

Output includes creation time, modification time, access time, permissions, and inode information.

## Understanding Inodes

Each file and directory in Linux is represented by an inode (index node), which stores metadata about the file:

```bash
ls -i file.txt    # Show the inode number
```

The inode contains:

- File permissions
- Owner and group IDs
- File size
- Timestamps (access, modification, change)
- Number of hard links
- Pointers to data blocks

The filename itself is stored in a directory entry that points to the inode.

## Disk Usage and Management

### Checking Disk Space

Use `df` to check disk space usage:

```bash
df -h    # Human-readable sizes
```

### Checking Directory Size

Use `du` to check directory sizes:

```bash
du -sh directory/    # Summary, human-readable
du -h --max-depth=1 /home    # Show only one level deep
```

### Finding Large Files

Combine `find` and `sort` to locate large files:

```bash
find /home -type f -size +100M -exec ls -lh {} \; | sort -k 5 -h
```

## File System Types

Linux supports many file system types:

- **ext4**: The default for many Linux distributions
- **XFS**: High-performance file system for large-scale data
- **Btrfs**: Modern file system with advanced features
- **ZFS**: Advanced file system with data integrity features
- **NTFS/FAT32**: Windows file systems (read/write support through drivers)

Check mounted file systems with:

```bash
mount
```

## Mounting File Systems

The `mount` command attaches a file system to the directory tree:

```bash
# Mount a USB drive
sudo mount /dev/sdb1 /mnt/usb

# Mount an ISO file
sudo mount -o loop image.iso /mnt/iso

# Mount with specific options
sudo mount -t ext4 -o rw,noatime /dev/sda2 /mnt/data
```

Unmount with:

```bash
sudo umount /mnt/usb
```

For persistent mounts across reboots, edit `/etc/fstab`.

## Special File Operations

### Creating Empty Files of Specific Size

Use `truncate` or `dd`:

```bash
# Create a 100MB empty file
truncate -s 100M file.img

# Alternative with dd
dd if=/dev/zero of=file.img bs=1M count=100
```

### Creating Sparse Files

Sparse files only use disk space for non-zero data:

```bash
# Create a 1GB sparse file
truncate -s 1G sparse.img
```

### Securely Wiping Files

To securely delete sensitive files:

```bash
# Install secure deletion tools
sudo apt install secure-delete

# Securely wipe a file
srm sensitive_file.txt

# Alternative using dd
dd if=/dev/urandom of=sensitive_file.txt bs=1M conv=notrunc
rm sensitive_file.txt
```

## Practical Examples

Let's look at some practical examples of working with the Linux file system:

### Setting Up a Shared Directory

Create a directory where members of a group can collaborate:

```bash
# Create the directory
sudo mkdir /opt/shared_project

# Set the group
sudo chgrp developers /opt/shared_project

# Make files inherit the group and give group write permission
sudo chmod 2775 /opt/shared_project

# Verify permissions
ls -ld /opt/shared_project
```

The result `drwxrwsr-x` shows the directory is writable by the group, and the `s` indicates the setgid bit is set.

### Creating a Secure Configuration File

Create a configuration file with sensitive information that only specific users can access:

```bash
# Create the file
sudo touch /etc/myapp/secret.conf

# Set ownership and restrictive permissions
sudo chown myapp:myapp /etc/myapp/secret.conf
sudo chmod 600 /etc/myapp/secret.conf

# Verify permissions
ls -l /etc/myapp/secret.conf
```

The result `-rw-------` shows that only the owner can read and write the file.

### Setting Up Temporary Directory with Sticky Bit

Create a directory where multiple users can create files, but can't delete each other's files:

```bash
# Create the directory
sudo mkdir /var/data/temp

# Set permissions with sticky bit
sudo chmod 1777 /var/data/temp

# Verify permissions
ls -ld /var/data/temp
```

The result `drwxrwxrwt` shows the directory is writable by everyone, and the `t` indicates the sticky bit is set.

## Moving Forward

Understanding the Linux file system hierarchy and permission model is fundamental to effectively working with Linux. This knowledge will help you navigate systems, troubleshoot issues, and configure applications properly.

In the next part, we'll explore package management, learning how to install, update, and remove software efficiently using different package managers like apt, dnf, and yum.

The file system forms the foundation of Linux system organization. By learning these concepts, you're building a solid base for all your future Linux endeavors.
