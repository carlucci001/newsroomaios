# Claude Code Rules for Newsroom AIOS

## Scope Discipline - CRITICAL

1. **Only modify files directly related to the task.** If the user asks you to add an AI config page, do NOT touch button styles, CSS, layout components, or anything else unrelated.
2. **Never refactor, clean up, or "improve" code you weren't asked to change.** No drive-by fixes. No style tweaks. No "while I'm here" changes.
3. **Do not modify package.json or package-lock.json** unless the task explicitly requires adding/removing a dependency.
4. **Do not modify globals.css, tailwind.config.ts, or any shared UI components** (button.tsx, etc.) unless that is the specific task.
5. **Before committing, review your staged files.** If any file is not directly required by the task, unstage it.

## Git Rules

- Only commit files that are part of the current task
- Do not commit unrelated changes that happen to be in the working directory
- Always use `git add <specific-files>` never `git add .` or `git add -A`
- Do not push without explicit user approval

## Code Changes

- Do not add comments, docstrings, or type annotations to code you didn't change
- Do not reformat or restructure existing code
- Do not rename variables or functions unless that is the task
- Do not add error handling or validation beyond what the task requires
- Preserve all existing styling, classes, and visual appearance of components you touch

## Testing

- After making changes, verify nothing visual has regressed if the change touches any component with UI
- If the dev server is running, check the affected pages still render correctly
