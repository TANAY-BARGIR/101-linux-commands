---
title: 'Tracking Changes with Git'
order: 3
description: 'Learn how to stage changes, create commits, and understand the Git workflow'
---

Now that you have a Git repository set up, it's time to learn how to track changes to your files. This section covers checking status, staging changes, creating commits, and viewing your history.

## Checking Repository Status

Before making changes, it's good practice to check the status of your repository:

```bash
git status
```

This shows which files are tracked, untracked, modified, or staged. It's one of the most used Git commands and gives you a clear picture of what's happening in your repository.

## Tracking New Files

When you create new files in your repository, Git won't track them automatically. To start tracking a new file:

```bash
git add filename.txt
```

To add multiple files:

```bash
git add file1.txt file2.txt file3.txt
```

Or to add all files in the current directory and its subdirectories:

```bash
git add .
```

This stages the files for commit. You can verify this with `git status`, which will now show the files under "Changes to be committed".

## Understanding the Staging Area

The staging area (or "index") is a crucial concept in Git. It's a preparation area where you organize what will go into your next commit.

Think of it as a loading dock where you prepare goods for shipping. You can:

- Add files to the staging area (`git add`)
- Remove files from the staging area (`git reset`)
- Review what's in the staging area (`git status`)

Staging lets you commit only some changes while keeping others for a different commit, allowing you to create clean, logical commits.

### Staging Parts of a File

Sometimes you only want to stage some changes in a file, not all of them. You can do this with:

```bash
git add -p filename.txt
```

This will interactively ask you which parts ("hunks") of the file to stage, giving you options like:

- `y`: stage this hunk
- `n`: don't stage this hunk
- `s`: split the hunk into smaller hunks
- `q`: quit, don't stage this or any remaining hunks
- `?`: display help

## Making Commits

Once you've staged your changes, you can commit them to your repository:

```bash
git commit -m "Add initial project files"
```

The `-m` flag allows you to add a commit message directly on the command line. Your message should briefly describe the changes in the commit.

For more detailed commit messages, omit the `-m` flag:

```bash
git commit
```

This opens your configured text editor where you can write a more detailed message.

### Good Commit Message Practices

A good commit message follows these guidelines:

1. Short, descriptive summary line (50 characters or less)
2. Optional blank line followed by a more detailed explanation
3. Written in imperative mood ("Add feature", not "Added feature")
4. Explains what and why, not how (the code shows how)

Example of a good commit message:

```
Add user authentication feature

- Implement login/logout functionality
- Set up password hashing with bcrypt
- Add session management

This addresses security requirements in issue #42
```

### Shortcuts for Staging and Committing

To stage and commit all modified files in one step:

```bash
git commit -a -m "Update configuration files"
```

The `-a` flag automatically stages all modified tracked files (but not new files).

## Viewing Changes

To see what changes you've made but haven't staged yet:

```bash
git diff
```

To see what you've staged that will go into your next commit:

```bash
git diff --staged
```

These commands show the exact lines added and removed, which is helpful for reviewing your changes before committing them.

## Removing Files

To remove a file from Git and your working directory:

```bash
git rm filename.txt
```

To remove a file from Git but keep it in your working directory (useful for files you accidentally started tracking):

```bash
git rm --cached filename.txt
```

Don't forget to add the file to your `.gitignore` if you want to keep it untracked.

## Moving and Renaming Files

To move or rename a file:

```bash
git mv old_filename.txt new_filename.txt
```

This is equivalent to:

```bash
mv old_filename.txt new_filename.txt
git rm old_filename.txt
git add new_filename.txt
```

## Viewing Commit History

To see the history of your commits:

```bash
git log
```

This displays each commit with its:

- SHA-1 checksum (unique identifier)
- Author name and email
- Date and time
- Commit message

For a more concise view:

```bash
git log --oneline
```

Or to see changes in each commit:

```bash
git log -p
```

To see statistics for each commit:

```bash
git log --stat
```

To visualize the commit history with a graph:

```bash
git log --graph --oneline --all
```

## Undoing Things

Git provides several ways to undo changes:

### Amending the Last Commit

If you've made a mistake in your last commit or forgot to include some changes:

```bash
git commit --amend
```

This replaces the last commit with a new one that includes both the changes from the previous commit and any staged changes you have now.

### Unstaging Files

If you've staged a file but want to unstage it:

```bash
git restore --staged filename.txt
```

In older Git versions:

```bash
git reset HEAD filename.txt
```

### Discarding Changes

To discard changes in your working directory and revert to the last committed version:

```bash
git restore filename.txt
```

In older Git versions:

```bash
git checkout -- filename.txt
```

> ⚠️ **Warning**: This operation cannot be undone. Any local changes will be lost.

## Tagging

Tags are references that point to specific points in Git history, typically used to mark release versions.

To create a lightweight tag:

```bash
git tag v1.0.0
```

To create an annotated tag with a message:

```bash
git tag -a v1.0.0 -m "Version 1.0.0 release"
```

To list all tags:

```bash
git tag
```

To show information about a specific tag:

```bash
git show v1.0.0
```

By learning these fundamental Git commands for tracking changes, you'll be able to maintain a clean and well-documented history of your project. In the next section, we'll explore branching, which enables you to work on multiple features or fixes in parallel.
