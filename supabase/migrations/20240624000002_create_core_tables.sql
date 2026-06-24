-- ============================================
-- LK Gloss & Detail — Core Tables (Phase 1.2)
-- ============================================

-- 1. Profiles — Admin user(s)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Services — Catalog of detailing services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  description JSONB,
  short_description JSONB,
  icon TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'exterior',
  price_min NUMERIC(10,2) NOT NULL CHECK (price_min >= 0),
  price_max NUMERIC(10,2) NOT NULL CHECK (price_max >= price_min),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  multipliers JSONB DEFAULT '{"small": 1.0, "medium": 1.3, "large": 1.6, "xl": 2.0}'::jsonb,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services"
  ON services FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Admin can manage services"
  ON services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 3. Car Assessments — AI analysis results
CREATE TABLE IF NOT EXISTS car_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT,
  image_urls TEXT[] NOT NULL,
  ai_result JSONB,
  selected_service_ids UUID[],
  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  duration_minutes INTEGER,
  summary_text JSONB,
  services_breakdown JSONB,
  vehicle_size TEXT,
  dirt_level TEXT,
  locale TEXT DEFAULT 'de',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE car_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assessments"
  ON car_assessments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 4. Appointments — Client bookings
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_assessment_id UUID REFERENCES car_assessments(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  vehicle TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can manage appointments"
  ON appointments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 5. Blocked Slots
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blocked slots"
  ON blocked_slots FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage blocked slots"
  ON blocked_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 6. Gallery Images
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title JSONB,
  category TEXT NOT NULL,
  before_url TEXT,
  after_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gallery"
  ON gallery_images FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage gallery"
  ON gallery_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 7. Contact Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_interest TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can read contact submissions"
  ON contact_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX IF NOT EXISTS idx_car_assessments_session ON car_assessments(session_token);
CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_images_sort ON gallery_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);
