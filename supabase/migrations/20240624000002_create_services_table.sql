-- ============================================
-- LK Gloss & Detail — Services Table
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT,
  icon TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'exterior',
  price_small NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_medium NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_large NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_suv NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services"
  ON services FOR SELECT TO anon, authenticated
  USING (active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);
