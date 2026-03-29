# Git Workflow

## Quick Sync Before PR

Before creating a PR, sync your branch with main:

```bash
# Method 1: Rebase (cleaner history - preferred)
git checkout main
git pull origin main
git checkout <your-branch>
git rebase main

# Method 2: Merge (preserves commits)
git checkout main
git pull origin main
git checkout <your-branch>
git merge main
```

## Branch Strategy

- `main` — production-ready code
- Feature branches — `ticket-XX` (e.g., `ticket-22`)

## Commit Messages

Include ticket references in commits:
```
refs #22 add item create form
closes #20 add database schema
```

The `commit-msg` hook automatically appends Trello links to commits.

## Pre-Push Hook

A `pre-push` hook runs before every push and:
1. Checks if your main is behind `origin/main`
2. Warns you if main has new commits
3. Gives you the option to proceed or cancel

This prevents pushing stale code and reduces rebase conflicts.

## Useful Aliases

Add to your `.gitconfig` or run directly:

```bash
# Sync current branch with main via rebase
git config --global alias.sync-main '!git checkout main && git pull origin main && git checkout - && git rebase main'

# Sync current branch with main via merge
git config --global alias.sync-main-merge '!git checkout main && git pull origin main && git checkout - && git merge main'
```

Then use:
```bash
git sync-main     # rebase method
git sync-main-merge  # merge method
```