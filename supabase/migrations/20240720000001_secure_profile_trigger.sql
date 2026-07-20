-- ============================================
-- LK Gloss & Detail — Secure Profiles Default Role (Phase 11.1 Feedback)
-- ============================================

-- Update trigger function to insert 'user' instead of 'admin' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
