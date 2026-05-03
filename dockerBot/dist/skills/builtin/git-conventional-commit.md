---
name: git-conventional-commit
description: Compose conventional-commit messages and group related changes into atomic commits. Use whenever you stage and commit changes.
---

# Git Conventional Commit

When committing changes, use this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

| type     | when                                                 |
| -------- | ---------------------------------------------------- |
| `feat`   | New user-visible feature                             |
| `fix`    | Bug fix                                              |
| `chore`  | Tooling / deps / non-functional refactors            |
| `refactor` | Internal restructuring without behavior change     |
| `docs`   | Docs only                                            |
| `test`   | Tests only                                           |
| `build`  | Build system / Dockerfile / CI                       |
| `style`  | Formatting (no logic change)                         |

## Rules

- Subject ≤ 72 chars, imperative mood ("add" not "added").
- Body explains the **why** when not obvious; wrap at 100 chars.
- One commit = one logical change. Don't dump unrelated changes.
- Reference issues with `Closes #N` in the footer.
- Don't end the subject with a period.

## When to Stop and Ask

Before committing, stop and ask the user if:

- The diff is large (>20 files) — propose a split.
- The diff includes secrets or `.env` files (refuse to commit those).
- The change touches >1 obviously distinct area (frontend + db migration + ci).

## Example

```
feat(api): add /projects/:id/git/commit-and-push endpoint

Wraps git commit + push in a single transactional flow that scrubs
remote URL credentials in finally{}. Returns step-by-step results so
clients can show partial failures (commit ok, push failed, etc.).

Closes #42
```
