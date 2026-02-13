# Audit Vercel Environment Variables

Audit all Vercel production env vars for trailing newlines, carriage returns, or whitespace that cause silent failures (500 errors on Stripe, broken API keys, invalid URLs).

## Steps

1. Run the audit script in report-only mode first:

```bash
node scripts/audit-env.js
```

2. Review the findings. CRITICAL items are env vars known to break API calls (Stripe keys, URLs, Firebase config). Warnings are less impactful but should still be fixed.

3. If issues are found, ask the user whether to fix them automatically. If yes, run:

```bash
node scripts/audit-env.js --fix
```

4. After fixing, remind the user:
   - A new deployment is needed for fixes to take effect
   - The next `git push` triggers a deploy automatically
   - Or run `npx vercel --prod` for an immediate redeploy

5. Run the audit again to confirm everything is clean:

```bash
node scripts/audit-env.js
```

## When to Use

- After adding or updating any Vercel env var
- When debugging unexplained 500 errors on API routes
- Before major releases or tenant rollouts
- After running `vercel env add` from any source (CLI, dashboard, scripts)

## Root Cause

Vercel env vars get trailing `\n` or `\r\n` from copy-paste in the dashboard or CLI input. These invisible characters cause:
- Stripe API rejecting URLs as "Not a valid URL"
- API keys failing authentication silently
- Firebase config mismatches
- Broken redirect URLs after payment flows

## Code-Level Defense

All server-side API routes should use `safeEnv()` from `src/lib/env.ts` instead of raw `process.env` reads. This trims values automatically as a safety net even if the Vercel env vars are dirty.
