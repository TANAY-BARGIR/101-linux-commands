---
title: 'Working with Remote Repositories'
order: 6
description: 'Learn how to use GitHub, GitLab, and other platforms to collaborate on code'
---

So far, we've focused on using Git locally. However, one of Git's greatest strengths is its ability to work with remote repositories, enabling collaboration with others. In this section, we'll explore how to work with remote repositories like those hosted on GitHub, GitLab, and Bitbucket.

## Understanding Remote Repositories

A remote repository is a version of your project hosted on the internet or a network. You can have multiple remote repositories, usually with read or read/write access. Remote repositories are essential for:

- Collaborating with others
- Contributing to open source projects
- Backing up your code
- Deploying your applications

Common remote repository hosting services include:

- GitHub
- GitLab
- Bitbucket
- Azure DevOps

## Viewing Remote Repositories

To see which remote servers you have configured:

```bash
git remote
```

This shows the shortnames of each remote handle you've specified. If you cloned a repository, you should see `origin` by default.

To see more details:

```bash
git remote -v
```

This shows the URLs that Git has stored for each remote:

```
origin  https://github.com/username/project.git (fetch)
origin  https://github.com/username/project.git (push)
```

## Adding Remote Repositories

To add a new remote repository:

```bash
git remote add <shortname> <url>
```

For example:

```bash
git remote add origin https://github.com/username/project.git
```

You can use whatever shortname you like instead of "origin".

## Fetching from Remote Repositories

To get data from a remote repository:

```bash
git fetch <remote>
```

This downloads all branches and data from the remote repository but doesn't merge it into your working files. For example:

```bash
git fetch origin
```

This command only downloads the data to your local repository; it doesn't automatically merge it with your work or modify what you're currently working on.

## Pulling from Remote Repositories

To fetch and automatically merge remote changes:

```bash
git pull <remote> <branch>
```

For example, to pull from the `main` branch of the `origin` remote:

```bash
git pull origin main
```

This is equivalent to:

```bash
git fetch origin
git merge origin/main
```

If you have tracking set up (more on this later), you can simply use:

```bash
git pull
```

## Pushing to Remote Repositories

After you've made commits locally, you can push them to a remote repository:

```bash
git push <remote> <branch>
```

For example:

```bash
git push origin main
```

If no one else has pushed since you last fetched, your push should succeed. If someone else has pushed in the meantime, your push will be rejected. You'll need to pull their changes first, integrate them with yours, and then try pushing again.

### Pushing a New Branch

To push a new branch to a remote repository:

```bash
git push -u origin feature-branch
```

The `-u` flag (or `--set-upstream`) sets up tracking, which simplifies future push and pull commands.

## Working with Remote Branches

Remote branches are references to the state of branches in your remote repositories. They're named using the pattern `<remote>/<branch>`:

- `origin/main`: The main branch on the origin remote
- `upstream/develop`: The develop branch on the upstream remote

These remote-tracking branches are local references that you can't move; Git moves them automatically when you communicate with the remote repository.

### Viewing Remote Branches

To see all remote branches:

```bash
git branch -r
```

To see both local and remote branches:

```bash
git branch -a
```

### Setting Up Tracking Branches

Tracking branches are local branches that have a direct relationship to a remote branch. When you clone a repository, Git automatically creates a `main` branch that tracks `origin/main`.

To create a new tracking branch:

```bash
git checkout -b feature-branch origin/feature-branch
```

Or the shorthand:

```bash
git checkout --track origin/feature-branch
```

With newer Git versions:

```bash
git switch -c feature-branch --track origin/feature-branch
```

Once you have a tracking branch set up, you can use simplified commands:

```bash
git pull  # Equivalent to git pull origin feature-branch
git push  # Equivalent to git push origin feature-branch
```

### Deleting Remote Branches

To delete a remote branch:

```bash
git push origin --delete feature-branch
```

Or the older syntax:

```bash
git push origin :feature-branch
```

## Working with GitHub and Similar Platforms

While Git provides the distributed version control system, platforms like GitHub, GitLab, and Bitbucket add additional features:

- Web interface for repositories
- Pull/Merge requests for code review
- Issue tracking
- Project management tools
- Actions/CI for automation
- Wiki and documentation
- Code security scanning

### Setting Up SSH Authentication

HTTPS is simple but requires entering credentials frequently. SSH provides a more convenient and secure method:

1. Generate an SSH key:

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

2. Add the key to your SSH agent:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

3. Add the public key to your GitHub/GitLab account (under Settings > SSH Keys)

4. Test your connection:

```bash
ssh -T git@github.com
```

5. Update your remote URL to use SSH:

```bash
git remote set-url origin git@github.com:username/repository.git
```

### Creating a Repository on GitHub

To create a new repository on GitHub and push your local repository:

1. Create the repository on GitHub (without initializing it)
2. Connect your local repository:

```bash
git remote add origin git@github.com:username/repository.git
```

3. Push your code:

```bash
git push -u origin main
```

## Working with Forks

When contributing to open-source projects, you often work with forks, personal copies of another user's repository.

### Setting Up a Fork

1. Fork the repository on GitHub/GitLab (using the web interface)
2. Clone your fork:

```bash
git clone https://github.com/your-username/project.git
```

3. Add the original repository as a remote called "upstream":

```bash
git remote add upstream https://github.com/original-owner/project.git
```

### Keeping Your Fork Updated

To update your fork with changes from the original repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

Or more concisely:

```bash
git pull upstream main
```

Then push the changes to your fork:

```bash
git push origin main
```

## Pull Requests / Merge Requests

Pull requests (PRs) or merge requests (MRs) are how you propose changes to a project. These are web interface features, not Git commands.

### Creating a Pull Request (General Workflow)

1. Create a branch for your feature:

```bash
git checkout -b feature-user-profiles
```

2. Make your changes:

```bash
# Make changes to files
git add changed-files
git commit -m "Implement user profiles feature"
```

3. Push your branch to your remote:

```bash
git push origin feature-user-profiles
```

4. Go to the hosting service (GitHub, GitLab, etc.) and create a pull request through the web interface.

### Pull Request Best Practices

- Give PRs clear, descriptive titles
- Include details about the changes in the description
- Reference related issues with keywords like "Fixes #123"
- Keep PRs focused on a single feature or bug fix
- Use draft PRs for work in progress
- Respond promptly to review comments

## Handling Conflicts in Remote Workflows

When multiple people work on the same codebase, conflicts can occur. Here's how to handle them:

1. Try to pull the latest changes:

```bash
git pull origin main
```

2. If conflicts occur, resolve them:

   - Edit the conflicted files
   - Stage the resolved files with `git add`
   - Commit the resolved merge

3. Push your changes:

```bash
git push origin main
```

To reduce conflicts:

- Pull frequently
- Communicate with teammates
- Work on different files or sections when possible
- Keep commits focused and small

## Best Practices for Remote Collaboration

- **Push and pull frequently**: Stay synchronized with your team
- **Use branches for features**: Keep main branch clean
- **Write good commit messages**: Help others understand your changes
- **Use pull requests for code reviews**: Get feedback before merging
- **Keep local branches updated**: Regularly pull from upstream
- **Understand Git's networking model**: Know how local and remote repositories interact

With these remote repository skills, you're now equipped to collaborate effectively with others on Git projects. In the next section, we'll explore established collaborative workflows.
