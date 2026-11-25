---
name: lk-worktrees
description: Operational playbook for orchestrating LK Gloss & Detail across 4 isolated Git Worktrees (frontend, backend, testing, security) using the KRONOS Contract-First -> Unified Phase PR -> CodeRabbit workflow.
---

# LK Gloss & Detail — 4-Worktree Orchestration Playbook

## 1. Directory & Branch Map

Multi-root IDE workspace file: `d:\myProjects\lulezim_kodhimaj\lk-gloss-detail.code-workspace`

| Folder                                    | Branch              | Role               | Owned Paths                                                                                                                                                                                              |
| :---------------------------------------- | :------------------ | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `d:\myProjects\lulezim_kodhimaj`          | `main` / `feat/...` | **Orchestrator**   | Contract-First (`schemas/`, `types/`, `config/`, migrations), sync, merge, `pnpm verify`, PR                                                                                                             |
| `d:\myProjects\lulezim_kodhimaj-frontend` | `wt/frontend`       | **Frontend Agent** | `src/components/**`, `src/features/*/components/**`, `src/features/*/hooks/**`, `src/features/*/stores/**`, `src/features/*/utils/**`, `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `messages/*.json` |
| `d:\myProjects\lulezim_kodhimaj-backend`  | `wt/backend`        | **Backend Agent**  | `src/app/api/**`, `src/actions/**`, `src/features/*/actions/**`, `src/lib/**`, `src/config/**`, `src/proxy.ts`, `supabase/migrations/**`                                                                 |
| `d:\myProjects\lulezim_kodhimaj-testing`  | `wt/testing`        | **Testing Agent**  | `src/**/*.test.{ts,tsx}` _(excluding `src/test/security/**`)_, `e2e/**`                                                                                                                                  |
| `d:\myProjects\lulezim_kodhimaj-security` | `wt/security`       | **Security Agent** | `src/test/security/**`, `scripts/verifyArchitecture.mjs`                                                                                                                                                 |

### Default Model Roster & Quota Fallback (`/teamwork` / `swarm` mode)

When spawning workers in `/teamwork`, pin each worker to its Primary model automatically (and use `swarm(action="model")` to fall back cleanly without losing context if a worker hits quota). **Important:** Quota is shared across reasoning tiers (`Extra High` / `High` / `Medium`) of the same model, so fallbacks ALWAYS switch to a **different model**. **Backend Agent** MUST NEVER drop to `Medium` (only `Extra High` / `High`):

| Role               | Primary Model                                                       | Quota Fallback Chain (different model)                                            |
| :----------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **Orchestrator**   | `Gemini 4 Neon (Extra High)`                                        | `Claude Opus 5.5 (High)` -> `Claude Sonnet 5.5 (High)` _(or pause until refresh)_ |
| **Frontend Agent** | `Gemini 4 Neon (High)` _(use `Extra High` for flagship UI screens)_ | `Gemini 4 Argon (High)` -> `Claude Sonnet 5.5 (High)`                             |
| **Backend Agent**  | `Gemini 4 Neon (Extra High)` _(mandatory always Extra High)_        | `Claude Opus 5.5 (High)` -> `Claude Sonnet 5.5 (High)` _(never `Medium`!)_        |
| **Testing Agent**  | `Gemini 4 Hydrogen (Medium)`                                        | `Gemini 3.8 Flash (Medium)`                                                       |
| **Security Agent** | `Claude Opus 5.5 (Medium)`                                          | `Claude Sonnet 5.5 (High)` -> `Gemini 4 Neon (High)`                              |

## 2. Mandatory 8-Step Phase Execution Sequence

> **No Auto-Commits Rule (`.agents/AGENTS.md`):** Always ask for explicit user confirmation before executing `git commit` or `git push`.

1. **Context Load (Ground Truth Over Docs):** Read `AGENTS.md`, `.agents/skills/lk-lessons/SKILL.md`, and inspect the actual current state of the codebase (`git status`, `git log`, `src/`) and database before planning.
2. **Phase Plan Artifact (NO code before approval):** Present a plan with `RequestFeedback: true` listing:
   - Scope & architectural decisions;
   - Exact **Contract-First files** (SQL migrations, Zod schemas, TypeScript types, configs);
   - Explicit per-agent **Briefs** (`Frontend`, `Backend`, `Testing`, `Security`) with 0 overlapping files.
3. **Contract-First Commit & Safe Zero-Data-Loss Worktree Sync (Orchestrator):**
   - Create phase branch `feat/<phase-name>` from `main`.
   - Write ONLY the shared Contract-First files, share clickable file links, and obtain user confirmation to commit (`<contract-sha>`).
   - Sync all 4 worktree branches (`wt/frontend`, `wt/backend`, `wt/testing`, `wt/security`) onto `<contract-sha>` safely:
     1. **Protect work first:** Check `git status --porcelain` and `git log <contract-sha>..HEAD --oneline`. Stash uncommitted working-tree changes (`git stash push -u -m "pre-sync-backup"`) and create a backup branch (`git branch backup/wt-<name>-<timestamp> HEAD`) whenever unmerged local commits exist — NEVER run blind `reset --hard`.
     2. **Move branch safely & check alignment:** Check for colliding ignored files (`git ls-files --others --ignored --exclude-standard` vs `git ls-tree -r --name-only <contract-sha>`). If any ignored local file collides with paths in `<contract-sha>`, **stop** and back up those colliding ignored files before proceeding; continue only when no unresolved collisions remain. Then run `git merge --ff-only --no-overwrite-ignore <contract-sha>` and verify `git rev-parse HEAD` equals `<contract-sha>`. If `ff-only` fails OR `HEAD !== <contract-sha>`, confirm step 1 preserved local work, then realign cleanly with `git switch --no-overwrite-ignore -C wt/<name> <contract-sha>`.
     3. **Final SHA verification:** Run `git rev-parse HEAD` in all 4 worktrees and confirm every branch matches `<contract-sha>`.
4. **Parallel Execution (4 Agents via Swarm):**
   - Dispatch tasks in parallel to the 4 agents inside their owned worktree paths using the native `swarm` tool (`action: "add", model: "<id>", workspace: "share"`), strictly pinning models to the `AGENTS.md` Swarm Model Roster (`gemini-4-neon-high` for Frontend, `gemini-4-neon-xhigh` for Backend, `gemini-4-hydrogen-medium` for Testing, `claude-opus-5-5-medium` for Security).
   - Before executing code, print the `swarm action: "status"` table so the user sees the real pinned models and workspaces.
   - Each agent MUST read `AGENTS.md`, `.agents/skills/lk-lessons/SKILL.md`, and relevant `.agents/skills/*/SKILL.md` first.
5. **Unified Merge, Pre-PR Security Gate & Phase Gate (Orchestrator):**
   - Merge `wt/backend` -> `wt/frontend` -> `wt/testing` -> `wt/security` into `feat/<phase-name>`.
   - Have **Security Agent** audit the unified diff against `.agents/skills/lk-lessons/SKILL.md` and `AGENTS.md`.
   - Run `pnpm verify` (`verify:arch`, `typecheck`, `lint`, `test`, `build`) until 0 errors.
6. **Unified PR to `main`:** Secret audit (0 leaked credentials) -> ask user confirmation -> push `feat/<phase-name>` -> open 1 PR to `main` for CodeRabbit.
7. **Interactive CodeRabbit Review, Lessons Distillation & Risk-Based Security Delta Audit:**
   - Follow `AGENTS.md` Section 4: summarize all CodeRabbit findings and walk through them 1-by-1 interactively with industry-standard solutions before making edits.
   - Apply approved edits and **distill recurring lessons** (1 concise line per lesson, max 250 lines total) into `.agents/skills/lk-lessons/SKILL.md`.
   - **Risk-Based Security Delta Audit (Default-ON):** Mandatory for ANY post-review edit touching files outside Markdown docs (`*.md`) — run before `pnpm verify` and `push`.
   - Run `pnpm verify` (0 errors) -> ask user confirmation -> commit & push to PR.
8. **Educational Phase Debrief:** Deliver `AGENTS.md` Section 5 (file-by-file map, authoring agent, exports -> imports -> usage, state & security flow).
