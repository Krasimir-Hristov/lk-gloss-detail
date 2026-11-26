# LK Gloss & Detail — План за предаване на проекта и пускане онлайн (Go-Live)

Този наръчник описва точната 10-минутна процедура за прехвърляне на базата данни към безплатен Supabase акаунт на клиента (**Люлезим Коджимай**), качване във Vercel и свързване на собствен домейн.

> **Важно за архитектурата:** Проектът работи **без Resend / без външни имейл услуги** — всички контактни съобщения и резервации влизат директно в Supabase, а клиентът ги преглежда в Admin панела (`/admin` и `/admin/messages`) и се обажда или пише в WhatsApp с 1 клик. В системата е заключен **само 1 единствен админ**.

---

## 📋 1. Данни от клиента (за Impressum & домейна)

1. **Имейл акаунт** за регистрация на безплатен Supabase проект.
2. **Фирмени данни за Германия (`messages/de.json`, `messages/en.json`, `messages/el.json`):**
   - Точно име на фирмата и собственик (**Lulezim Kodhimaj**).
   - Физически адрес (Neuhausen auf den Fildern / район Щутгарт).
   - Телефонен номер (и WhatsApp номер).
   - Данъчен номер: **Steuernummer** и/или **USt-IdNr.**
3. **Домейн:** напр. `lkglossanddetail.de` (Hetzner, IONOS, Strato, Namecheap или Cloudflare Registrar — ~5–10 €/год.).

---

## 🗄️ 2. Нова безплатна Supabase база данни (на имейла на клиента)

### Стъпка 2.1: Създаване на проекта

1. Влезте в [supabase.com](https://supabase.com) с имейла на клиента и изберете **Free Tier** (500 MB DB + 1 GB Storage).
2. Създайте проект `lk-gloss-detail` в регион **Frankfurt (`eu-central-1`)** (задължително за скорост и GDPR/DSGVO).

### Стъпка 2.2: Миграции (всички схеми + RLS + Single-Admin Lock)

Изпълнете по ред скриптовете от `supabase/migrations/` в **SQL Editor** (или с `supabase link --project-ref <ref>` && `supabase db push`):

1. `20240624000000_enable_pgvector.sql`
2. `20240624000002_create_services_table.sql`
3. `20240624000004_restructure_services_table.sql`
4. `20240709000001_create_booking_tables.sql`
5. `20240709000002_create_booking_rpc.sql`
6. `20240714000001_create_chatbot_knowledge.sql`
7. `20240715000001_create_contact_submissions.sql`
8. `20240720000000_admin_auth_rls.sql`
9. `20240720000001_secure_profile_trigger.sql`
10. `20260720195813_admin_profiles_trigger.sql`
11. `20260722000000_services_jsonb_i18n.sql`
12. `20260722000001_gallery_storage_policies.sql`
13. **`20261125000001_admin_hardening_messages_booking_fix.sql`** _(Single-Admin DB Lock, `contact_submissions.status`, поправен booking RPC без заключване на отказани дати, `chatbot_knowledge.language = 'any'`)_

### Стъпка 2.3: Създаване на ЕДИНСТВЕНИЯ Админ & Заключване на Signups

> [!CAUTION]
> Следните 3 стъпки гарантират, че никой друг не може да се регистрира като админ:

1. В **Authentication -> Users -> Add user** създайте **1 единствен потребител** с имейла и паролата на клиента (отметнете _Auto Confirm User_).
2. В **SQL Editor** задайте роля `'admin'` за неговото UUID (след това `idx_profiles_single_admin` физически забранява втори админ в БД):
   ```sql
   INSERT INTO public.profiles (id, role)
   VALUES ('<USER_UUID_ОТ_AUTH_USERS>', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
3. **Задължително:** Отидете в **Authentication -> Sign In / Providers** и **ИЗКЛЮЧЕТЕ** _"Allow new users to sign up"_.

### Стъпка 2.4: Начални данни (Services & Chatbot KB)

От **Project Settings -> API** вземете `Project URL`, `anon/publishable` ключ и `service_role/secret` ключ, сложете ги временно в локалния `.env` (работят и `SUPABASE_SERVICE_ROLE_KEY`, и `SUPABASE_SECRET_KEY`) и пуснете веднъж:

```powershell
pnpm tsx scripts/seed-services.ts
pnpm tsx scripts/seed-chatbot.ts
```

_(След като услугата тръгне, клиентът управлява услугите и цените изцяло през `/admin/services` — сайтът, букингът, AI оценката и AI чатботът се синхронизират автоматично.)_

---

## 🤖 3. OpenRouter (AI ключ)

- Засега остава Вашият текущ `OPENROUTER_API_KEY`.
- Конфигурирани са икономичните модели `google/gemini-2.5-flash-lite` (за чатбот и превод на услуги) с fallback `google/gemini-2.5-flash` и `google/gemini-2.5-flash` за AI оценката по снимки.
- Когато решите да го прехвърлите на клиента, просто сменете `OPENROUTER_API_KEY` във Vercel -> **Environment Variables** и направете Redeploy.

---

## 🚀 4. Бърз 10-минутен Чеклист: Домейн + Vercel + Нов Supabase

1. **Supabase Auth URLs:** В новия Supabase -> **Authentication -> URL Configuration**:
   - **Site URL:** `https://lkglossanddetail.de`
   - **Redirect URLs:** `https://lkglossanddetail.de/**` и `https://lkglossanddetail.de/admin/login`
2. **Vercel Deploy:** Импортирайте GitHub репото `Krasimir-Hristov/lk-gloss-detail` във Vercel (Region: **Frankfurt `fra1`**) и добавете Environment Variables:
   ```env
   NEXT_PUBLIC_SITE_URL=https://lkglossanddetail.de
   NEXT_PUBLIC_SUPABASE_URL=https://<новия_проект>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<новия_anon_или_publishable_key>
   SUPABASE_SERVICE_ROLE_KEY=<новия_service_role_или_secret_key>
   OPENROUTER_API_KEY=<текущия_openrouter_ключ>
   ```
3. **Домейн & DNS:** Във Vercel -> **Settings -> Domains** добавете `lkglossanddetail.de` и `www.lkglossanddetail.de`, след което въведете показаните A / CNAME записи в DNS панела на регистратора. _(Не са нужни MX/SPF/DKIM записи за Resend.)_

---

## ✅ 5. Финален Smoke Test на живо

1. **Вход в Админ панела (`/de/admin/login`):** Влезте с единствения админ акаунт -> проверете Overview (4-те KPI карти), новия **Messages Inbox** (`/de/admin/messages`), Appointments и Services.
2. **Контакт -> Messages Inbox:** Пратете тестово съобщение от `/de#contact` -> вижте червения брояч в менюто -> отворете `/de/admin/messages` -> прочетете и тествайте бутоните за обаждане (`tel:`) и WhatsApp.
3. **Услуги -> Чатбот & Сайт Auto-Sync:** Променете цена в `/de/admin/services` -> проверете че цената се обновява веднага на началната страница, в `/de/booking` и в отговора на AI Чатбота.
4. **Резервация & Освобождаване на дата:** Направете тестова резервация в `/de/booking`, после я маркирайте като `cancelled` в админа -> проверете, че датата отново е свободна в календара за клиенти.
5. **Блокиране на период:** Тествайте 1-клик блокиране на ден в календара и блокиране на период от менюто **Block Date**.
