# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Monitorture — a client-side React + TypeScript + Vite toolkit for comparing and
testing computer monitors. Tailwind v4 for styling. State persists to
localStorage and serializes to a shareable URL fragment. Deployed to GitHub
Pages at https://monitorture.com.

- `npm run dev` — local dev server
- `npm run build` — typecheck (`tsc -b`) + production build to `dist/`

## Branch — standing rule

**Always work on the existing `claude/…` branch: `claude/monitor-comparison-app-bb0k5l`.**
This is the default and only branch to use. Never create a new branch and never
push to `main` or any other branch. All commits and pushes go to this branch.
(It is also the branch the Pages deploy workflow builds from.)

## Committing and publishing — standing rule

**Never commit or push on your own.** Make and verify changes in the working
tree, but do not run `git commit` or `git push` until I explicitly say **"go"**.

When — and only when — I say **"go"**, perform the full release in one sequence:

1. **Commit** the working changes with a clear, descriptive message.
2. **Push** to `claude/monitor-comparison-app-bb0k5l` (the branch above).
3. **Publish** by triggering the GitHub Automation: dispatch the
   **"Deploy to GitHub Pages"** workflow (`.github/workflows/pages.yml`, via
   `workflow_dispatch`), which builds and deploys the site.

If I ask for changes without saying "go", stop after the working-tree edits and
wait. "Go" is the only trigger for the commit + push + publish sequence.
