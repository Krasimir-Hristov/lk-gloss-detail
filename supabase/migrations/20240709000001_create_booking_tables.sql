-- ============================================
-- LK Gloss & Detail — Booking Tables (Phase 7)
-- Simplified direct booking: no Resend, no double opt-in.
-- Idempotent: safe to run multiple times.
-- ============================================

-- Admin profiles table (required for RLS admin checks)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Blocked dates (admin can block whole days)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read blocked dates" ON blocked_dates;
CREATE POLICY "Anyone can read blocked dates"
  ON blocked_dates FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage blocked dates" ON blocked_dates;
CREATE POLICY "Only admins can manage blocked dates"
  ON blocked_dates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Confirmed appointments
-- PII is protected: only service role (server-side) can read.
-- anon/authenticated can only INSERT, not SELECT.
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_description TEXT,
  booking_date DATE NOT NULL UNIQUE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create an appointment" ON appointments;
CREATE POLICY "Anyone can create an appointment"
  ON appointments FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can manage appointments" ON appointments;
CREATE POLICY "Only admins can manage appointments"
  ON appointments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Junction table: appointments <-> services
CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);

ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create appointment services" ON appointment_services;
CREATE POLICY "Anyone can create appointment services"
  ON appointment_services FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can read appointment services" ON appointment_services;
CREATE POLICY "Only admins can read appointment services"
  ON appointment_services FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can manage appointment services" ON appointment_services;
CREATE POLICY "Only admins can manage appointment services"
  ON appointment_services FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_booking_date ON appointments(booking_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_blocked_date ON blocked_dates(blocked_date);