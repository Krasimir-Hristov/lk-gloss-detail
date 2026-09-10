# LK Gloss & Detail — План за предаване на проекта и настройка на клиентски акаунти

Този наръчник описва стъпка по стъпка всичко, което трябва да направите при срещата с клиента (**Люлезим Коджимай**), за да прехвърлите всички услуги на негово име, така че той да притежава напълно своята база данни, домейн и API ключове.

---

## 📋 1. Данни, които да вземете от клиента на срещата

Преди да започнете регистрациите, поискайте следните данни от Люлезим:

1. **Основен Google / Gmail акаунт** (или фирмен имейл), който той ще използва за вход в платформите.
2. **Точни фирмени данни за Германия (за Impressum & фактури):**
   - Точно наименование на фирмата (напр. _Lulezim Kodhimaj Autopflege_ или Gewerbe регистрация).
   - Физически адрес на дейността (улица, номер, пощенски код, град — Neuhausen auf den Fildern / район Щутгарт).
   - Телефонен номер за контакт с клиенти.
   - Данъчен номер: **Steuernummer** и/или **USt-IdNr.** (ако вече е издаден от Finanzamt).
3. **Банкова карта** (дебитна/кредитна) за покриване на дребни първоначални разходи (закупуване на домейн ~$10/година и първоначален кредит в OpenRouter $5-$10).

---

## 🌐 2. Закупуване на Домейн (`.de`)

Препоръчително е домейнът да бъде регистриран директно на името на Люлезим:

- **Препоръчани имена:** `lkglossanddetail.de` или `lk-gloss-detail.de`.
- **Къде да го купите:**
  - **Hetzner / Strato / IONOS** (много популярни и евтини в Германия за `.de` домейни — обикновено около 5–10 € на година).
  - **Namecheap** или **Cloudflare Registrar** (също отлични опции с безплатен DNS мениджмънт).

---

## 🗄️ 3. Създаване на Supabase на негово име (База данни)

Тъй като продавате проекта заедно със собствеността върху базата данни:

### Стъпка 3.1: Регистрация

1. Влезте в [supabase.com](https://supabase.com) и направете регистрация с неговия имейл.
2. Безплатният план (**Free Tier**) включва:
   - 500 MB база данни (за детайлинг бизнес стига за години напред).
   - 1 GB Storage за файлове.
   - Вградена автентикация и pgvector.
3. Създайте нов проект:
   - **Име:** `lk-gloss-detail`
   - **Database Password:** Генерирайте силна парола и я запишете на сигурно място!
   - **Region:** Изберете **Frankfurt (eu-central-1)** — задължително за бързина и съответствие с GDPR/DSGVO в Германия.

### Стъпка 3.2: Прехвърляне на базата данни и миграциите

В проекта всички схеми се намират във версия контрол в папка `supabase/migrations/`:

1. Отворете **SQL Editor** в Supabase конзолата на новия проект.
2. Изпълнете по ред скриптовете от `supabase/migrations/`:
   - `20240624000000_enable_pgvector.sql` (активира векторите)
   - `20240624000002_create_services_table.sql`
   - `20240624000004_restructure_services_table.sql`
   - `20240709000001_create_booking_tables.sql` (таблици за резервации и RLS)
   - `20240709000002_create_booking_rpc.sql` (функция за сигурно записване на час)
   - `20240714000001_create_chatbot_knowledge.sql` (векторна таблица за чатбота)
   - `20240715000001_create_contact_submissions.sql`
   - `20240720000000_admin_auth_rls.sql`
   - `20240720000001_secure_profile_trigger.sql`
   - `20260720195813_admin_profiles_trigger.sql`
   - `20260722000000_services_jsonb_i18n.sql`
   - `20260722000001_gallery_storage_policies.sql`
     _(Алтернативно: Ако имате инсталиран Supabase CLI, можете просто да свържете новия проект с `supabase link --project-ref <новия_ref>` и да пуснете `supabase db push`)._

### Стъпка 3.3: Storage Buckets (Файлове и снимки)

В лявото меню **Storage** проверете дали са създадени следните кофи (buckets):

- `services` (или `service-images`) — за снимките на услугите (Public).
- `gallery` — за снимките Преди/След (Public).
- `car-assessment-images` — (Private, RLS защитен).

### Стъпка 3.4: Създаване на Админ акаунт за Люлезим

1. Отидете на **Authentication** -> **Users** -> **Add user**.
2. Въведете неговия имейл и парола за достъп до Админ панела на сайта (`/admin/login`).
3. Влезте в **SQL Editor** и проверете в таблица `profiles` дали за неговия потребител фигурира ред с `role: 'admin'`. Ако не е създаден автоматично от тригера:
   ```sql
   INSERT INTO profiles (id, role)
   VALUES ('<USER_UUID_ОТ_AUTH_USERS>', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

### Стъпка 3.5: Вземане на новите ключове

От **Project Settings** -> **API** запишете:

- `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (или `ANON_KEY`)
- `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY` (Пазете го строго секретен!).

---

## 🤖 4. Регистрация на OpenRouter (AI модели за Чатбота и Оценката)

Проектът използва OpenRouter за достъп до Gemini 2.5 Flash и GPT-4o:

1. Отворете [openrouter.ai](https://openrouter.ai) и регистрирайте акаунт с имейла на клиента.
2. Влезте в **Credits**:
   - Заредете **5$ или 10$**. Понеже се използва предимно `gemini-2.5-flash` (който струва стотинки за милион токени), тези $5-$10 ще му стигнат за месеци напред!
3. Отидете на **Keys** -> **Create Key**:
   - Име на ключа: `LK Detail Production`
   - Копирайте ключа -> `OPENROUTER_API_KEY`.

---

## ✉️ 5. Регистрация на Resend (Имейл известия)

За да получава Люлезим запитванията от формата за контакт:

1. Отворете [resend.com](https://resend.com) и направете безплатен акаунт с неговия имейл.
2. Безплатният план дава 3000 имейла на месец.
3. Отидете на **API Keys** -> **Create API Key** -> копирайте `RESEND_API_KEY`.
4. След като закупите домейна:
   - Влезте в **Domains** -> **Add Domain** -> въведете напр. `lkglossanddetail.de`.
   - Resend ще ви даде 3 DNS записа (DKIM, SPF, MX).
   - Влезте в контролния панел на закупения домейн и ги добавете в DNS настройките.
   - Натиснете **Verify** в Resend.
5. Когато домейнът е валидиран, в `src/actions/contact.ts` ред 56 сменете подателя на:
   `from: "LK Gloss & Detail <kontakt@lkglossanddetail.de>"`

---

## ⚖️ 6. Попълване на данните за Германия (Impressum & Datenschutz)

Законово изискване в Германия (TMG / DSGVO):
Отворете файловете с локализации в `messages/`:

- `messages/de.json`
- `messages/en.json`
- `messages/el.json`
  и попълнете данните в секциите:
- Име на собственика: **Lulezim Kodhimaj**
- Точен адрес на сервиза / дейността.
- Телефон и официален контактен имейл.
- **Steuernummer / USt-IdNr.**

---

## 🚀 7. Хостинг във Vercel и свързване на Домейна

1. Влезте във [vercel.com](https://vercel.com) (можете да го хостнете във вашия акаунт или в негов безплатен акаунт).
2. Свържете GitHub репозиторито `lk-gloss-detail`.
3. В раздел **Environment Variables** въведете новите клиентски стойности:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<новия_проект>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<новия_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<новия_service_role_key>
   OPENROUTER_API_KEY=sk-or-v1-...
   RESEND_API_KEY=re_...
   CONTACT_EMAIL=пощата_на_люлезим@gmail.com
   ```
4. В **Settings** -> **Domains** във Vercel добавете купения домейн: `lkglossanddetail.de` и `www.lkglossanddetail.de`.
5. Добавете съответните A / CNAME записи в DNS панела на домейна към Vercel.
6. **Много важно за Supabase Auth:**
   Върнете се в конзолата на Supabase -> **Authentication** -> **URL Configuration**:
   - **Site URL:** `https://lkglossanddetail.de`
   - **Redirect URLs:** Добавете `https://lkglossanddetail.de/**` и `https://lkglossanddetail.de/admin/login`.

---

## ✅ 8. Финален чеклист за приемане (Smoke Test на живо)

След деплой направете тези 5 теста заедно с Люлезим:

1. **Вход в Админ панела:** Отворете `https://lkglossanddetail.de/admin/login`, влезте с неговия акаунт и му покажете календара и управлението на услугите.
2. **AI Оценка:** Качете 4 тестови снимки на кола в `/assessment`, проверете дали излиза правилната прогнозна цена и дали работи формата.
3. **Резервация:** Запазете тестова дата в `/booking` и вижте как тя веднага се появява в неговия админ календар.
4. **Контактна форма:** Изпратете тестово съобщение от `/contact` и се уверете, че пристига в пощата му.
5. **AI Чатбот:** Задайте му въпрос на немски (напр. _"Was kostet eine Innenreinigung?"_) и се уверете, че отговаря бързо и коректно.
