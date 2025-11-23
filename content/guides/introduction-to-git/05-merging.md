---
title: 'Merging and Resolving Conflicts'
order: 5
description: 'Learn how to combine changes from different branches and resolve conflicts'
---

Once you've completed work on a branch, you'll want to incorporate those changes back into your main branch. This is done with the `git merge` command. In this section, we'll explore how to merge branches and handle merge conflicts.

## Understanding Merging

Merging is the process of combining changes from one branch into another. When you merge, Git attempts to automatically combine the changes. If the same part of a file wasn't changed in both branches, Git will merge them automatically. If there are conflicting changes, Git will notify you and ask you to resolve them.

## Types of Merges

Git performs two types of merges:

### Fast-Forward Merge

A fast-forward merge occurs when the target branch has no new commits since your branch was created. In this case, Git simply moves the pointer forward. No new commit is created.

Before:

```
main    A---B---C
                 \
feature           D---E
```

After:

```
main    A---B---C---D---E

feature             D---E
```

### Three-Way Merge (Recursive Merge)

A three-way merge occurs when both branches have progressed independently. Git creates a new "merge commit" that combines the changes from both branches.

Before:

```
main    A---B---C---F
                 \
feature           D---E
```

After:

```
main    A---B---C---F---G
                 \     /
feature           D---E
```

Where G is the merge commit.

## Basic Merge Process

To merge a branch into your current branch:

1. Switch to the branch you want to merge into (typically `main`):

```bash
git checkout main
```

2. Merge your feature branch:

```bash
git merge feature-user-profiles
```

If the merge is a fast-forward merge, Git will simply update the branch pointer. If it's a three-way merge, Git will create a new merge commit.

## Merge Commit Messages

For three-way merges, Git will open your editor to create a merge commit message. The default is usually sufficient:

```
Merge branch 'feature-user-profiles' into main
```

But you can provide more context if needed.

## Merge Strategies

Git offers several merge strategies for different scenarios:

- `--ff` (default): Do a fast-forward merge if possible, otherwise create a merge commit
- `--no-ff`: Always create a merge commit, even if a fast-forward merge is possible
- `--ff-only`: Only perform the merge if it's a fast-forward merge
- `--squash`: Combine all changes into a single new commit

Example of forcing a merge commit:

```bash
git merge --no-ff feature-branch
```

Example of a squash merge:

```bash
git merge --squash feature-branch
git commit -m "Add user profile feature"
```

## Handling Merge Conflicts

Sometimes Git can't automatically merge changes because both branches modified the same part of a file. This is called a merge conflict.

When a conflict occurs, Git will tell you which files are conflicted:

```
Auto-merging profile.html
CONFLICT (content): Merge conflict in profile.html
Automatic merge failed; fix conflicts and then commit the result.
```

### Understanding Conflict Markers

Git modifies the conflicted files and adds conflict markers to show the conflicting parts:

```html
<<<<<<< HEAD
<h1>User Profile Page</h1>
=======
<h1>Customer Profile</h1>
>>>>>>> feature-user-profiles
```

These markers mean:

- `<<<<<<< HEAD`: The beginning of the conflicting section in your current branch
- `=======`: The divider between the conflicting changes
- `>>>>>>> feature-user-profiles`: The end of the conflicting section, with changes from the branch you're merging

### Resolving Conflicts

To resolve a conflict:

1. Open the conflicted file(s) in your editor
2. Edit the file to resolve the conflict by:
   - Choosing one version
   - Combining both versions
   - Writing something completely different
3. Remove the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Save the file
5. Stage the resolved file:

```bash
git add profile.html
```

6. Complete the merge by committing:

```bash
git commit -m "Resolve merge conflict in profile page heading"
```

Git will create a merge commit that includes your conflict resolutions.

### Tools for Resolving Conflicts

Many tools can help you resolve merge conflicts:

- **Git's built-in tool**: `git mergetool`
- **Visual Studio Code**: Built-in conflict resolution interface
- **IntelliJ/PyCharm**: Built-in merge tools
- **Beyond Compare, P4Merge, etc.**: External diff tools

To configure a merge tool:

```bash
git config --global merge.tool vscode
```

To start the configured merge tool:

```bash
git mergetool
```

### Aborting a Merge

If you want to cancel a merge that has conflicts:

```bash
git merge --abort
```

This will return you to the state before you started the merge.

## Prevention is Better Than Cure

While Git handles merges well, it's better to avoid complex conflicts:

- **Communicate with your team**: Know who's working on what
- **Keep branches short-lived**: Merge frequently to reduce divergence
- **Structure your code modularly**: Separate concerns to reduce conflicts
- **Pull from main regularly**: Keep your branch updated with the latest changes

## Advanced Merge Techniques

### Cherry-Picking

Sometimes you want to apply a single commit from one branch to another:

```bash
git cherry-pick commit-hash
```

This creates a new commit on your current branch with the same changes as the specified commit.

### Rebase as an Alternative to Merging

Another way to integrate changes is rebasing:

```bash
git checkout feature-branch
git rebase main
```

This moves your feature branch to start from the tip of main, creating a linear history:

Before:

```
main    A---B---C---F
                 \
feature           D---E
```

After:

```
main    A---B---C---F
                     \
feature              D'---E'
```

Where D' and E' are the replayed commits.

> ⚠️ **Warning**: Never rebase branches that others are working on. Rebasing changes commit history, which can cause problems for others using the branch.

## When to Merge vs. When to Rebase

- **Use merge when**:
  - You want to preserve the complete history
  - The branch is shared with others
  - You want to record that a feature branch existed
- **Use rebase when**:
  - You want a cleaner, linear history
  - You're working on a personal branch
  - You want to integrate the latest changes from the main branch

## Best Practices for Merging

- **Review changes before merging**: Understand what you're merging
- **Test before and after merging**: Ensure functionality doesn't break
- **Use meaningful commit messages**: Explain the purpose of the merge
- **Keep merges focused**: Merge one feature at a time
- **Delete branches after merging**: Keep your repository clean

With these merging skills, you're now equipped to combine changes from different branches and handle any conflicts that arise. In the next section, we'll explore working with remote repositories to collaborate with others.
