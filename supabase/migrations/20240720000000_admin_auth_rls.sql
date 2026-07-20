-- ============================================
-- LK Gloss & Detail — Admin Auth & RLS Policies (Phase 11.1)
-- ============================================

-- 1. Create a secure trigger function to sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any existing auth users to profiles table
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Update policies for services table
-- Drop old SELECT policy
DROP POLICY IF EXISTS "Anyone can read active services" ON services;

-- New SELECT policy: Public can only see active services, admins can see all services
CREATE POLICY "Anyone can read active services"
  ON services FOR SELECT TO anon, authenticated
  USING (
    active = true 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
    )
  );

-- Admin management policy: Full CRUD access for admins
DROP POLICY IF EXISTS "Only admins can manage services" ON services;
CREATE POLICY "Only admins can manage services"
  ON services FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
    )
  );
