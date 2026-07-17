-- ============================================
-- LK Gloss & Detail — Contact Submissions Table (Phase 9)
-- Simple contact form: name, email, phone only.
-- Idempotent: safe to run multiple times.
-- ============================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact" ON contact_submissions;
CREATE POLICY "Anyone can submit contact"
  ON contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can read contact submissions" ON contact_submissions;
CREATE POLICY "Only admins can read contact submissions"
  ON contact_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
