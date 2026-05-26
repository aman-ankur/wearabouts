# Repository Instructions For Coding Agents

## Project Context

Before implementing, read:

- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- The active implementation plan in `docs/product/plans/`

The product is now named **Wearabouts**. Older docs may still mention Travogue as the original working name.

## Git Identity

This repository must use the personal Git identity, not the work/Booking identity.

Expected repo-local config:

```bash
git config user.name "aman-ankur"
git config user.email "amanankur1110@gmail.com"
```

Before committing, verify:

```bash
git config user.name
git config user.email
```

Expected output:

```text
aman-ankur
amanankur1110@gmail.com
```

If the values are different, set them locally in this repo before committing. Do not change global Git config.

## Branching And Push

- Use `codex/` branch names for agent-created implementation branches.
- The GitHub remote is `origin`: `https://github.com/aman-ankur/wearabouts.git`.
- Push feature work to a branch unless the user explicitly asks to push to `main`.
- If rewriting identity/history is ever needed, confirm with the user before force-pushing.

## Local Dev Server

- Always run the Wearabouts dev server on port `3000`.
- Do not allow Next.js or any other dev server to fall back to another port such as `3001`.
- Before starting the dev server, check whether port `3000` is occupied. If it is, kill the process using port `3000`, then start the server on port `3000`.
- Preferred command:

```bash
npm run dev -- -p 3000
```

## Commit Hygiene

- Keep commits small and phase-based.
- Run the relevant checks before each completion claim.
- For the current Next.js app, use:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```
