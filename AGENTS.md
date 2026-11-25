@.github/copilot-instructions.md

# LK Gloss & Detail — Инженерна Конституция & Multi-Agent Worktree Протокол (AGENTS.md)

Този документ е върховният архитектурен, продуктов и инженерен закон за проекта **LK Gloss & Detail** (`d:\myProjects\lulezim_kodhimaj`), изграден по доказания 4-Worktree стандарт от **KRONOS**. Всеки AI агент (**Оркестратор**, **Frontend**, **Backend**, **Testing**, **Security**) и всеки разработчик прочита и спазва тези правила без изключение.

> **Критично правило за Git (по `.agents/AGENTS.md`):** **No Auto-Commits** — НИКОГА не изпълнявай `git commit` или `git push` автоматично без изрично потвърждение от потребителя.

---

## 1. Ключови Архитектурни & Бизнес Правила

1. **Next.js 16 App Router (`src/proxy.ts`, без `middleware.ts`):**
   - `middleware.ts` е строго забранен. Мрежовият периметър е единствено `src/proxy.ts` с CVE-2025-29927 header scrubbing (`x-middleware-subrequest`), rate limiting и admin session guard.
   - `params`, `searchParams`, `cookies()` и `headers()` винаги се `await`-ват.
2. **React 19, TypeScript & Styling:**
   - Всички React компоненти са **Arrow Functions** (`const MyComp: React.FC<Props> = () => { ... }`) във файлове **`PascalCase.tsx`**. Логически/helper/hook/schema/action/test файлове са **`camelCase.ts`**.
   - **Лимит на файл:** максимум **300 реда** в `src/` (проверявано автоматично от `scripts/verifyArchitecture.mjs`).
   - **Без `any`:** само строги интерфейси, `unknown` + Type Guards и Zod (`z.infer`).
   - **Tailwind CSS v4:** само `bg-linear-to-*` (`bg-gradient-to-*` е забранен).
   - **State:** `zustand` за клиентски UI state, `@tanstack/react-query` за сървърни данни, `zod` за двойна бариера (вход + AI/DB изход).
   - **i18n:** всички потребителски текстове минават през `next-intl` (`de`, `en`, `el`).
3. **AI Car Assessment — Фиксирано Бизнес Правило:**
   - **`dirtLevel` (`light` / `moderate` / `heavy`) НЕ определя цената** — служи единствено информативно за клиента и текстовата AI диагностика.
   - **Цената се определя единствено от `carSize`** (разпозната от AI) **× живите активни цени от БД таблица `services` (`active = true`)**, за да отразява винаги актуалните цени от админ панела.
   - OpenRouter моделите се управляват централизирано (с Primary + Fallback и `.env` override) вместо hardcoded бавни/скъпи модели.
4. **Без автоматични unit тестове без команда:** Никога не пиши unit тестове автоматично извън изрично одобрен план или команда от потребителя.

---

## 2. Топология на 4-те Git Worktrees, Роли & Задължителен 8-Стъпков Протокол

### Задължителен 8-Стъпков Цикъл за Всяка Фаза

1. **Зареждане на контекст (тихо, преди плана):** Прочети `AGENTS.md`, `.agents/skills/lk-worktrees/SKILL.md`, `.agents/skills/lk-lessons/SKILL.md` и провери реалното състояние на кода/базата (`git status`, `git log`, `src/`).
2. **План на фазата (Артефакт с `Proceed` — НУЛА код преди одобрение):** Представи структуриран план на български с:
   - точния обхват и архитектурните решения;
   - **точния списък на Contract-First файловете** (SQL миграции, Zod схеми, TypeScript типове, конфигурации);
   - **индивидуални брийфове за 4-те агента** (`Frontend`, `Backend`, `Testing`, `Security`) с 0 припокриване на файлове.
3. **Contract-First & Safe Zero-Data-Loss Worktree Sync (Оркестратор):** След одобрение Оркестраторът написва Contract-First файловете, показва ги с кликаеми линкове, иска потвърждение за commit (по `No Auto-Commits`) и синхронизира 4-те worktrees (`wt/frontend`, `wt/backend`, `wt/testing`, `wt/security`) върху точния Contract commit SHA по 3-стъпковата Zero-Data-Loss процедура в `.agents/skills/lk-worktrees/SKILL.md`.
4. **Паралелно изпълнение от 4-те агента:** Оркестраторът пуска паралелно 4-те агента в техните 4 worktree папки (при `/teamwork` с таблицата **Модели по роли** по-долу; при обикновен чат агентите наследяват активния модел) със задължителна инструкция да прочетат `AGENTS.md` и `.agents/skills/lk-lessons/SKILL.md`.
5. **Обединяване, Pre-PR Security Gate & `pnpm verify`:** Оркестраторът мърджва `wt/backend` -> `wt/frontend` -> `wt/testing` -> `wt/security` във фазовия клон, пуска **Security Agent** да одитира обединения diff по `lk-lessons/SKILL.md` + `AGENTS.md`, и изпълнява `pnpm verify` до **0 грешки**.
6. **1 Общ PR към `main`:** Проверка за 0 изтекли тайни -> изрично потвърждение от потребителя -> push -> отваряне на 1 PR към `main` за CodeRabbit.
7. **Интерактивен CodeRabbit Разбор + `lk-lessons` + Risk-Based Delta Одит:** По Раздел 4 — обобщение + въпросник точка по точка с индустриални решения -> прилагане на одобрените промени -> дестилация на повтаряемите уроци (1 ред на правило, макс. 250 реда) в `.agents/skills/lk-lessons/SKILL.md` -> **Risk-Based Security Delta одит** (задължителен за всяка промяна извън чисто `*.md` файлове) -> **`pnpm verify`** (0 грешки) -> потвърждение за commit & push към PR-а.
8. **Образователен Разбор (По Раздел 5):** Подробна карта файл по файл (кой агент го е писал, какво прави, Exports -> Imports -> Usage, state и сигурност).

### 4 Паралелни Изолирани Worktrees (Зони на Собственост)

| Worktree Папка                            | Клон          | Зона на Собственост (Zero Conflicts)                                                                                                                                                                     | Роля / Инструкция за Агента                                                                                                                                                                                                              |
| :---------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `d:\myProjects\lulezim_kodhimaj-frontend` | `wt/frontend` | `src/components/**`, `src/features/*/components/**`, `src/features/*/hooks/**`, `src/features/*/stores/**`, `src/features/*/utils/**`, `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `messages/*.json` | **Frontend Agent:** Достъпни, мобилно-адаптивни React 19 UI компоненти (`PascalCase.tsx`, Arrow Functions, `bg-linear-to-*`, `next-intl`, Zustand + TanStack Query). Никога не пипа `src/app/api/**`, `src/lib/ai/**` или `supabase/**`. |
| `d:\myProjects\lulezim_kodhimaj-backend`  | `wt/backend`  | `src/app/api/**`, `src/actions/**`, `src/features/*/actions/**`, `src/lib/**`, `src/config/**`, `src/proxy.ts`, `supabase/migrations/**`                                                                 | **Backend Agent:** Route Handlers, Server Actions, LangGraph/OpenRouter графове с Primary+Fallback, `src/proxy.ts`, rate limiting, Supabase заявки и RLS миграции. Двойна Zod бариера и `try/catch` навсякъде.                           |
| `d:\myProjects\lulezim_kodhimaj-testing`  | `wt/testing`  | `src/**/*.test.{ts,tsx}` _(без `src/test/security/**`)_, `e2e/**`                                                                                                                                        | **Testing Agent:** Целенасочени Vitest unit/contract и Playwright тестове (само по одобрен фазов план).                                                                                                                                  |
| `d:\myProjects\lulezim_kodhimaj-security` | `wt/security` | `src/test/security/**`, `scripts/verifyArchitecture.mjs`                                                                                                                                                 | **Security & Arch Agent:** Одитира и тества CVE-2025-29927 header scrubbing, SSRF/payload/prompt-injection защити, RLS изолация, rate-limit и автоматизирани архитектурни правила.                                                       |

### Модели по Роли и Автоматичен Fallback при Квота (при `/teamwork` / Swarm)

> **КРИТИЧНО ПРАВИЛО ЗА СТАРТИРАНЕ (SWARM ПРОТОКОЛ):** Забранено е пускането на паралелни работници с общо `invoke_subagent` и `Model: 'inherit'`, защото това наследява сляпо един и същ модел за всички. Задължително се използва нативният инструмент `swarm` (`action: "add", model: "<id>", workspace: "share"`) с точните системни идентификатори от таблицата. Преди старта Оркестраторът задължително изпълнява `swarm action: "status"` и показва таблица на потребителя с реално зачислените модели. При изчерпана квота превключва модела в движение (`swarm action: "model"`) без загуба на контекст. За **Backend Agent** никога не се ползва `Medium`.

| Роля               | Системен ID в Swarm        | Display Име                  | Fallback Верига при Квота (различен пул)           | Бележка                                                                                 |
| :----------------- | :------------------------- | :--------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Orchestrator**   | `gemini-4-neon-xhigh`      | `Gemini 4 Neon (Extra High)` | `claude-opus-5-5-high` -> `claude-sonnet-5-5-high` | Планиране (`/plan`), Contract-First, merge, CodeRabbit разбор.                          |
| **Frontend Agent** | `gemini-4-neon-high`       | `Gemini 4 Neon (High)`       | `claude-sonnet-5-5-high`                           | Премиум UI и UX детайл (flagship UI: `xhigh`; бързи UI задачи: `gemini-4-carbon-high`). |
| **Backend Agent**  | `gemini-4-neon-xhigh`      | `Gemini 4 Neon (Extra High)` | `claude-opus-5-5-high` -> `claude-sonnet-5-5-high` | LangGraph, API сигурност, Supabase RLS, `proxy.ts` (никога `Medium`!).                  |
| **Testing Agent**  | `gemini-4-hydrogen-medium` | `Gemini 4 Hydrogen (Medium)` | `claude-sonnet-5-5-low`                            | Бърз и икономичен (`Hydrogen` замества `3.8 Flash`); верифицира се от Vitest.           |
| **Security Agent** | `claude-opus-5-5-medium`   | `Claude Opus 5.5 (Medium)`   | `claude-sonnet-5-5-high` -> `gemini-4-neon-high`   | **Задължително Opus!** Cross-Model Pre-PR одит (независими очи + отделен пул).          |

---

## 3. Задължителен Phase Gate (`pnpm verify`)

Нито една фаза или PR не се счита за завършена, докато `pnpm verify` не премине с **0 грешки**:

1. `pnpm verify:arch` — `node scripts/verifyArchitecture.mjs` (без `middleware.ts`, лимит 300 реда, `PascalCase.tsx` / `camelCase.ts`, Arrow Functions, без `bg-gradient-to-*`, без `..` в `@/` алиаси).
2. `pnpm typecheck` — `next typegen && tsc --noEmit`.
3. `pnpm lint` — `eslint` (забрана за `any`).
4. `pnpm test` — `vitest run`.
5. `pnpm build` — успешен production build на Next.js 16.

---

## 4. Закон за CodeRabbit & PR Review (Интерактивен Разбор)

1. **Никога тихо/автоматично поправяне** преди обсъждане с потребителя.
2. **Общо обобщение (Summary):** реални проблеми vs дребни/фалшиви тревоги.
3. **Разбор бележка по бележка:** реален проблем (файл, ред, риск) + защо е важно + индустриални решения с препоръка `(Recommended)`.
4. **Изпълнение, `lk-lessons` & Risk-Based Security Delta одит:** прилагане на одобрените решения -> дестилация в `.agents/skills/lk-lessons/SKILL.md` (1 ред на правило, <= 250 реда) -> Security Delta одит (за всяка промяна извън чисто `*.md`) -> `pnpm verify` (0 грешки) -> потвърждение за commit & push.

---

## 5. Закон за Обучение и Подробен Разбор след Всяка Фаза (Educational Phase Debrief)

След всяка завършена фаза Оркестраторът представя структуриран разбор на български:

1. **Карта файл по файл** (кой агент/worktree го е писал, какво прави, защо е нужен);
2. **Карта на връзките** (`Exports -> Imports -> Usage`);
3. **Поток на данните, State & Сигурност** (Server vs Client, Zustand/TanStack Query/DB, защити и бъдещи капани).

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
