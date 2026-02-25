# Claude Code Rules for Newsroom AIOS

## Scope Discipline - CRITICAL

1. **Only modify files directly related to the task.** If the user asks you to add an AI config page, do NOT touch button styles, CSS, layout components, or anything else unrelated.
2. **Never refactor, clean up, or "improve" code you weren't asked to change.** No drive-by fixes. No style tweaks. No "while I'm here" changes.
3. **Do not modify package.json or package-lock.json** unless the task explicitly requires adding/removing a dependency.
4. **Do not modify globals.css, tailwind.config.ts, or any shared UI components** (button.tsx, etc.) unless that is the specific task.
5. **Before committing, review your staged files.** If any file is not directly required by the task, unstage it.

## Git & Commit Policy — MANDATORY

### The Golden Rule
**Every commit must be SURGICAL. One task = one commit. If a file isn't directly required by the task, it does not get staged.**

### Pre-Commit Checklist (run EVERY time before committing)
1. `git diff --staged` — read every line of every staged file. If ANY change is unrelated to the task, unstage that file.
2. `git status` — check for accidentally staged files. Compare the list against the task scope.
3. Confirm with the user: "I'm about to commit these specific files for this specific reason: [list]. OK?"
4. Never commit without showing the user exactly what's being committed.

### Commit Rules
- Always use `git add <specific-files>` — NEVER `git add .` or `git add -A`
- Only commit files that are part of the current task
- Do not commit unrelated changes that happen to be in the working directory
- Do not push without explicit user approval
- One task = one commit. Do not bundle unrelated fixes into a single commit.
- If working across both repos (newsroomaios + wnct-template), commit to each repo separately with separate messages.

### What NEVER Gets Committed
- `tmp_*.js`, `tmp_*.json`, `nul`, `*.backup-*` — temporary/scratch files
- `scripts/` changes unless the task specifically involves scripts
- `package.json` / `package-lock.json` unless adding/removing a dependency
- `globals.css`, `tailwind.config.ts`, shared UI components (button.tsx, etc.) unless that IS the task
- `.env*` files, service account files, credentials

### After a Bad Commit
- Do NOT use `git reset --hard` or `git checkout .` without explicit user approval
- If a commit included wrong files, create a NEW revert commit targeting only the bad changes
- Never amend published commits

## Code Changes

- Do not add comments, docstrings, or type annotations to code you didn't change
- Do not reformat or restructure existing code
- Do not rename variables or functions unless that is the task
- Do not add error handling or validation beyond what the task requires
- Preserve all existing styling, classes, and visual appearance of components you touch

## Testing

- After making changes, verify nothing visual has regressed if the change touches any component with UI
- If the dev server is running, check the affected pages still render correctly
