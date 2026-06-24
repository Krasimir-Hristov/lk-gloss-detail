# LK Gloss & Detail — Database Documentation

> **Project**: Mobile Autopflege & Detailing  
> **DB Engine**: PostgreSQL 15 + pgvector  
> **Host**: Supabase (`kiiicrywgildyumibdow`)  
> **Last Updated**: 2026-06-24

---

## 📐 Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LK GLOSS & DETAIL DB                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  profiles ◄─── auth.users (Supabase Auth)                   │
│                                                             │
│  services ◄─────────────────────────────────────────────────│
│    ↑                                                       │
│    └── service_vectors (embeddings for AI RAG)             │
│                                                             │
│  car_assessments                                            │
│    ↑                                                       │
│    └── appointments    (FK: car_assessment_id)             │
│                                                             │
│  blocked_slots (admin time blocks)                          │
│  gallery_images (before/after portfolio)                    │
│  contact_submissions (form entries)                         │
│                                                             │
│  chatbot_knowledge (FAQ + embeddings for chatbot)           │
│                                                             │
│  STORAGE BUCKETS:                                           │
│    car-assessment-images (private)                          │
│    gallery (public)                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tables

### 1. `profiles` — Admin Users

| Column         | Type        | Constraints                                     | Notes                  |
| -------------- | ----------- | ----------------------------------------------- | ---------------------- |
| `id`           | UUID        | PK, `gen_random_uuid()`                         |                        |
| `user_id`      | UUID        | UNIQUE, FK → `auth.users(id)` ON DELETE CASCADE | Links to Supabase Auth |
| `display_name` | TEXT        |                                                 | Admin's display name   |
| `avatar_url`   | TEXT        |                                                 | Profile picture        |
| `created_at`   | TIMESTAMPTZ | `DEFAULT now()`                                 |                        |

**RLS**: `authenticated` users can only manage their own profile (`auth.uid() = user_id`).  
**Purpose**: Identifies admin user(s) for authorization checks across all other tables.

---

### 2. `services` — Detailing Services Catalog

| Column              | Type          | Constraints                                                  | Notes                                     |
| ------------------- | ------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `id`                | UUID          | PK, `gen_random_uuid()`                                      |                                           |
| `name`              | JSONB         | NOT NULL                                                     | `{"de": "...", "en": "...", "el": "..."}` |
| `description`       | JSONB         |                                                              | Full description in 3 languages           |
| `short_description` | JSONB         |                                                              | Brief description for cards               |
| `icon`              | TEXT          |                                                              | Material icon name or URL                 |
| `image_url`         | TEXT          |                                                              | Hero image for Tinder-style cards         |
| `category`          | TEXT          | `DEFAULT 'exterior'`                                         | exterior, interior, paint, protection     |
| `price_min`         | NUMERIC(10,2) | NOT NULL, CHECK ≥ 0                                          | Base min price                            |
| `price_max`         | NUMERIC(10,2) | NOT NULL, CHECK ≥ price_min                                  | Base max price                            |
| `duration_minutes`  | INTEGER       | NOT NULL, CHECK > 0                                          | Estimated duration                        |
| `multipliers`       | JSONB         | `DEFAULT {"small":1.0, "medium":1.3, "large":1.6, "xl":2.0}` | Vehicle size multipliers                  |
| `active`            | BOOLEAN       | `DEFAULT true`                                               | Toggle visibility                         |
| `sort_order`        | INTEGER       | `DEFAULT 0`                                                  | Display ordering                          |
| `created_at`        | TIMESTAMPTZ   | `DEFAULT now()`                                              |                                           |

**RLS**: SELECT for everyone (active only), ALL for admin.  
**Indexes**: `idx_services_active`, `idx_services_sort`  
**Purpose**: Central catalog used by Homepage preview, Services page, AI Assessment swipe cards, and price calculation.

---

### 3. `car_assessments` — AI Analysis Results

| Column                 | Type          | Constraints             | Notes                                         |
| ---------------------- | ------------- | ----------------------- | --------------------------------------------- |
| `id`                   | UUID          | PK, `gen_random_uuid()` |                                               |
| `session_token`        | TEXT          |                         | Anonymous session (no auth needed for upload) |
| `image_urls`           | TEXT[]        | NOT NULL                | Array of 5 uploaded car photo URLs            |
| `ai_result`            | JSONB         |                         | Raw output from AI agent                      |
| `selected_service_ids` | UUID[]        |                         | Services user swiped "yes" on                 |
| `price_min`            | NUMERIC(10,2) |                         | Calculated min price                          |
| `price_max`            | NUMERIC(10,2) |                         | Calculated max price                          |
| `duration_minutes`     | INTEGER       |                         | Total estimated duration                      |
| `summary_text`         | JSONB         |                         | `{"de": "...", "en": "...", "el": "..."}`     |
| `services_breakdown`   | JSONB         |                         | Per-service breakdown                         |
| `vehicle_size`         | TEXT          |                         | small, medium, large, xl (from AI vision)     |
| `dirt_level`           | TEXT          |                         | low, medium, high (from AI vision)            |
| `locale`               | TEXT          | `DEFAULT 'de'`          | Language used during assessment               |
| `created_at`           | TIMESTAMPTZ   | `DEFAULT now()`         |                                               |

**RLS**: Admin only (full access).  
**Indexes**: `idx_car_assessments_session`  
**Purpose**: Stores AI assessment results for later reference, booking linking, and admin review.

---

### 4. `appointments` — Client Bookings

| Column              | Type        | Constraints                                                                           | Notes                  |
| ------------------- | ----------- | ------------------------------------------------------------------------------------- | ---------------------- |
| `id`                | UUID        | PK, `gen_random_uuid()`                                                               |                        |
| `car_assessment_id` | UUID        | FK → `car_assessments(id)` ON DELETE SET NULL                                         | Links to AI assessment |
| `client_name`       | TEXT        | NOT NULL                                                                              | Customer name          |
| `client_email`      | TEXT        | NOT NULL                                                                              | Customer email         |
| `client_phone`      | TEXT        |                                                                                       | Customer phone         |
| `vehicle`           | TEXT        |                                                                                       | e.g. "Porsche 911 GT3" |
| `date`              | DATE        | NOT NULL                                                                              | Appointment date       |
| `time`              | TIME        | NOT NULL                                                                              | Appointment time       |
| `status`            | TEXT        | NOT NULL, DEFAULT 'pending', CHECK IN ('pending','confirmed','completed','cancelled') | Booking status         |
| `notes`             | TEXT        |                                                                                       | Internal notes         |
| `created_at`        | TIMESTAMPTZ | `DEFAULT now()`                                                                       |                        |

**RLS**: INSERT for anyone (public booking form), ALL for admin.  
**Indexes**: `idx_appointments_date`, `idx_appointments_status`  
**Purpose**: Central booking system. Used by admin dashboard for calendar view and status management.

---

### 5. `blocked_slots` — Admin Time Blocks

| Column       | Type        | Constraints             | Notes               |
| ------------ | ----------- | ----------------------- | ------------------- |
| `id`         | UUID        | PK, `gen_random_uuid()` |                     |
| `date`       | DATE        | NOT NULL                | Blocked date        |
| `time`       | TIME        | NOT NULL                | Blocked time        |
| `reason`     | TEXT        |                         | Reason for blocking |
| `created_at` | TIMESTAMPTZ | `DEFAULT now()`         |                     |

**RLS**: SELECT for everyone, ALL for admin.  
**Indexes**: `idx_blocked_slots_date`  
**Purpose**: Prevents booking on unavailable slots. Queried alongside appointments for availability logic.

---

### 6. `gallery_images` — Before/After Portfolio

| Column       | Type        | Constraints             | Notes                                                 |
| ------------ | ----------- | ----------------------- | ----------------------------------------------------- |
| `id`         | UUID        | PK, `gen_random_uuid()` |                                                       |
| `url`        | TEXT        | NOT NULL                | Main image URL                                        |
| `title`      | JSONB       |                         | `{"de": "...", "en": "...", "el": "..."}`             |
| `category`   | TEXT        | NOT NULL                | interior, exterior, paint_correction, ceramic_coating |
| `before_url` | TEXT        |                         | "Before" image for comparison slider                  |
| `after_url`  | TEXT        |                         | "After" image for comparison slider                   |
| `sort_order` | INTEGER     | `DEFAULT 0`             | Display ordering                                      |
| `created_at` | TIMESTAMPTZ | `DEFAULT now()`         |                                                       |

**RLS**: SELECT for everyone, ALL for admin.  
**Indexes**: `idx_gallery_images_category`, `idx_gallery_images_sort`  
**Purpose**: Powers the gallery page with filterable categories and before/after comparison sliders.

---

### 7. `contact_submissions` — Contact Form Entries

| Column             | Type        | Constraints             | Notes                              |
| ------------------ | ----------- | ----------------------- | ---------------------------------- |
| `id`               | UUID        | PK, `gen_random_uuid()` |                                    |
| `name`             | TEXT        | NOT NULL                | Sender name                        |
| `email`            | TEXT        | NOT NULL                | Sender email                       |
| `phone`            | TEXT        |                         | Sender phone                       |
| `service_interest` | TEXT        |                         | Which service they're asking about |
| `message`          | TEXT        |                         | Their message                      |
| `created_at`       | TIMESTAMPTZ | `DEFAULT now()`         |                                    |

**RLS**: INSERT for anyone, SELECT for admin.  
**Purpose**: Stores contact form submissions for admin to review and respond.

---

### 8. `chatbot_knowledge` — FAQ / RAG Knowledge Base

| Column       | Type         | Constraints             | Notes                                      |
| ------------ | ------------ | ----------------------- | ------------------------------------------ |
| `id`         | UUID         | PK, `gen_random_uuid()` |                                            |
| `content`    | TEXT         | NOT NULL                | FAQ content or business info               |
| `embedding`  | VECTOR(1536) |                         | OpenAI-compatible embedding                |
| `metadata`   | JSONB        |                         | `{"source": "faq", "category": "pricing"}` |
| `language`   | TEXT         | `DEFAULT 'de'`          | de, en, el                                 |
| `created_at` | TIMESTAMPTZ  | `DEFAULT now()`         |                                            |

**RLS**: SELECT for everyone, ALL for admin.  
**Index**: HNSW on `embedding` (`vector_cosine_ops`, m=16, ef_construction=200)  
**Purpose**: Powers the RAG chatbot. Queried via `match_chatbot_docs()` for cosine similarity search.

---

### 9. `service_vectors` — Service Embeddings for AI

| Column       | Type         | Constraints                                     | Notes                       |
| ------------ | ------------ | ----------------------------------------------- | --------------------------- |
| `id`         | UUID         | PK, `gen_random_uuid()`                         |                             |
| `service_id` | UUID         | NOT NULL, FK → `services(id)` ON DELETE CASCADE | Linked service              |
| `content`    | TEXT         | NOT NULL                                        | Service description text    |
| `embedding`  | VECTOR(1536) |                                                 | OpenAI-compatible embedding |
| `metadata`   | JSONB        |                                                 | Extra metadata              |
| `language`   | TEXT         | `DEFAULT 'de'`                                  | de, en, el                  |
| `created_at` | TIMESTAMPTZ  | `DEFAULT now()`                                 |                             |

**RLS**: SELECT for everyone, ALL for admin.  
**Index**: HNSW on `embedding` (`vector_cosine_ops`, m=16, ef_construction=200)  
**Purpose**: Used by the AI assessment agent to semantically search service descriptions during price estimation.

---

## 🔍 Search Functions

### `match_chatbot_docs`

```sql
match_chatbot_docs(
  query_embedding VECTOR(1536),    -- Embedding of user question
  match_threshold FLOAT,           -- Similarity threshold (e.g., 0.7)
  match_count INT,                 -- Max results (e.g., 5)
  filter_language TEXT DEFAULT NULL -- Optional language filter
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, language TEXT, similarity FLOAT)
```

### `match_service_vectors`

```sql
match_service_vectors(
  query_embedding VECTOR(1536),    -- Embedding of search query
  match_threshold FLOAT,           -- Similarity threshold
  match_count INT,                 -- Max results
  filter_language TEXT DEFAULT NULL -- Optional language filter
)
RETURNS TABLE (id UUID, service_id UUID, content TEXT, metadata JSONB, language TEXT, similarity FLOAT)
```

---

## 🗄️ Storage Buckets

### `car-assessment-images`

| Property               | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Public**             | ❌ No (private)                                |
| **Max file size**      | 10 MB                                          |
| **Allowed MIME types** | image/jpeg, image/png, image/webp              |
| **RLS**                | Admin only (select, insert, delete)            |
| **Purpose**            | Store uploaded car photos during AI assessment |

### `gallery`

| Property               | Value                                    |
| ---------------------- | ---------------------------------------- |
| **Public**             | ✅ Yes                                   |
| **Max file size**      | 50 MB                                    |
| **Allowed MIME types** | image/jpeg, image/png, image/webp        |
| **RLS**                | Anyone can read, admin can upload/delete |
| **Purpose**            | Store portfolio before/after images      |

---

## 🔗 RLS Policies Summary

| Table                 | Public SELECT    | Public INSERT | Admin Access        |
| --------------------- | ---------------- | ------------- | ------------------- |
| `profiles`            | ❌               | ❌            | ✅ Own profile only |
| `services`            | ✅ (active only) | ❌            | ✅ Full CRUD        |
| `car_assessments`     | ❌               | ❌            | ✅ Full CRUD        |
| `appointments`        | ❌               | ✅ Anyone     | ✅ Full CRUD        |
| `blocked_slots`       | ✅               | ❌            | ✅ Full CRUD        |
| `gallery_images`      | ✅               | ❌            | ✅ Full CRUD        |
| `contact_submissions` | ❌               | ✅ Anyone     | ✅ SELECT           |
| `chatbot_knowledge`   | ✅               | ❌            | ✅ Full CRUD        |
| `service_vectors`     | ✅               | ❌            | ✅ Full CRUD        |

---

## 🏗️ Migrations History

| #   | File                                    | Date       | Description                                                                                      |
| --- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| 1   | `20240624000001_enable_pgvector.sql`    | 2024-06-24 | Enable pgvector extension                                                                        |
| 2   | `20240624000002_create_core_tables.sql` | 2024-06-24 | All core tables (profiles, services, assessments, appointments, blocked_slots, gallery, contact) |
| 3   | `20240624000003_create_rag_tables.sql`  | 2024-06-24 | RAG tables (chatbot_knowledge, service_vectors), search functions, HNSW indexes                  |

---

## 🔄 DB Migration Guide

If migrating away from Supabase:

1. **Auth**: Replace `auth.users` → your own users table. `profiles.user_id` will need remapping.
2. **Vector search**: `match_chatbot_docs()` and `match_service_vectors()` are pure PostgreSQL — portable to any Postgres 15+ with pgvector.
3. **Storage**: `car-assessment-images` and `gallery` buckets → your own file storage (S3, CloudFlare R2, etc.).
4. **RLS**: Replace with application-level middleware checks.
5. **HNSW indexes**: Supported in pgvector — same syntax works anywhere.
