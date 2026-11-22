---
name: lk-lessons
description: Compact curated lessons learned from CodeRabbit PR reviews and security audits for LK Gloss & Detail, plus strict self-maintenance rules for the Orchestrator (max 250 lines). ALWAYS load BEFORE coding in a new phase/chat, BEFORE opening a PR (Security Agent Pre-PR Gate), and AFTER resolving CodeRabbit findings.
---

# LK Gloss & Detail — Дестилирани Уроци (Institutional Memory)

## Протокол за Поддръжка (Задължителен за Оркестратора във всеки нов чат)

1. **Кога се обновява:** Веднага след приключване на всяко CodeRabbit PR ревю (след като потребителят е одобрил решенията точка по точка).
2. **Как се записва (Context Engineering):**
   - **НИКОГА** не копирай сурови коментари или дълги обяснения от CodeRabbit.
   - Дестилирай всеки повтаряем урок в **1 стегнат ред**: `- **[Област]** Не прави X -> Прави Y *(защо)*`.
   - Еднократни дребни печатни грешки **не** се записват.
3. **Твърд бюджет (<= 250 реда общо):**
   - Ако файлът наближи 250 реда, Оркестраторът го **компресира**: слива сходни правила и прехвърля механично проверимите правила директно в `scripts/verifyArchitecture.mjs`, `eslint.config.mjs` или Vitest тестове.
4. **Използване при нова фаза / нов чат:**
   - Оркестраторът включва в брийфа на всеки от 4-те worktree агента да прочете `AGENTS.md` и този файл преди писане на код.
   - `Security Agent` минава всички редове по-долу като **Pre-PR Gate** върху обединения diff преди отваряне на PR към CodeRabbit.

---

## Активни Уроци (Curated Checklist)

### Next.js 16 & CI

- **[Typecheck]** Не пускай само `tsc --noEmit` -> винаги `next typegen && tsc --noEmit` _(генерира `.next/types` при чист checkout/CI)_.
- **[API Timeouts]** За API route handlers с външни AI заявки задавай `export const maxDuration = 60;` и `timeout` на LLM клиента _(предотвратява Vercel serverless timeout)_.
- **[Error Statuses]** В API route handlers не хвърляй `ZodError` към `500` -> хващай `ZodError` / невалиден JSON и връщай HTTP `400` _(чисти клиентски грешки без шум в сървърните логове)_.

### Архитектура & Граници

- **[Path Canonicalization]** Забрани `..` traversal вътре в `@/` алиаси _(затваря path-traversal между модули)_.
- **[File Size]** Спазвай лимита от 300 реда за `.ts`, `.tsx` и `.css` файлове в `src/` _(поддържа модулност и четливост)_.
- **[Server Data Fetching]** Не дублирай `fetch` заявки в `useEffect`, когато вече има TanStack Query ключ -> споделяй един `queryKey` _(елиминира двойни HTTP заявки)_.

### Multi-Agent & Worktrees

- **[Ownership Globs]** Не допускай припокриващи се пътища между 4-те агента -> всяка зона е непресичаща се _(гарантира 0 merge конфликти)_.
- **[Worktree Sync]** Не разчитай само на `merge --ff-only` -> следвай 3-стъпковата Zero-Data-Loss процедура и верифицирай SHA на 4-те клона _(0 загубени файлове)_.
- **[Post-Review Gate]** Дестилирай `lk-lessons` + пусни Risk-Based Security Delta одит (при код/SQL/скриптове) **преди** финалния `pnpm verify` и `push` _(атомарен проверен PR)_.

### AI & Бизнес Логика (LK Gloss & Detail)

- **[Pricing Source of Truth]** Никога не променяй цената по `dirtLevel` -> цената се изчислява строго от `carSize` × активните записи в `services` (`.eq("active", true)`) _(динамични цени от админ панела; `dirtLevel` е само информативен)_.
- **[Vision Input Safety]** Никога не приемай суров `z.string()` за `imageBase64` -> валидирай `data:image/(jpeg|jpg|png|webp);base64,...` regex + максимален размер _(предотвратява SSRF и DoS през OpenRouter)_.
- **[Structured Output]** Не парсвай LLM JSON с ръчен `JSON.parse` -> използвай `.withStructuredOutput(ZodSchema)` с `safeParse` и централизиран `aiModelsConfig` Primary + Fallback _(надеждност и контрол на разходите)_.
