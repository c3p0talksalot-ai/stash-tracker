# Git Workflow - Trello Integration

## Commit Message Format

Use ticket references in commit messages to link commits to Trello cards:

```
refs #22 - Add item list view
refs #20, #24 - Data model and properties system
closes #22 - Complete item CRUD
```

### Actions
| Action | Meaning |
|--------|---------|
| `refs` | References work on ticket |
| `refs partial` | Work in progress |
| `closes` | Completes/finishes ticket |

### Auto-Links
The commit hook automatically appends Trello links to every commit:

```
refs #22 - Add item list view

Linked Trello cards:
- #22: https://trello.com/c/hmYnuVkt
```

## Installation

The hook is already installed. If you need to reinstall:

```bash
cp .git/hooks/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```

## Ticket Reference

| # | Trello Link |
|---|--------------|
| 20 | https://trello.com/c/7526XVX3 |
| 21 | https://trello.com/c/c0nDCgPW |
| 22 | https://trello.com/c/hmYnuVkt |
| 23 | https://trello.com/c/o7cGxbbX |
| 24 | https://trello.com/c/XJWe1PEW |
| 25 | https://trello.com/c/RqoeVVXv |
| 26 | https://trello.com/c/5eXW5NxE |
| 27 | https://trello.com/c/CcBtDakw |
| 28 | https://trello.com/c/WZKPtknq |
| 29 | https://trello.com/c/9efivEkB |
| 30 | https://trello.com/c/A9sYfX5b |