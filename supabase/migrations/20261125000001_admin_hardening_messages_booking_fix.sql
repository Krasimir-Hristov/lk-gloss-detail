-- ============================================
-- LK Gloss & Detail — Phase C Hardening, Messages Inbox & Booking Fix
-- Idempotent: safe to run multiple times on existing and fresh databases.
-- ============================================

-- 1. Single-Admin Lock & Hardened Profiles Trigger
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Physical guarantee: at most 1 admin profile can exist in the database.
-- Note: Only SELECT own-profile RLS policy remains on public.profiles (no client INSERT/UPDATE/DELETE).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_single_admin
  ON public.profiles (role)
  WHERE role = 'admin';

-- 2. Contact Submissions -> Messages Inbox
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread'
  CHECK (status IN ('unread', 'read', 'archived'));

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_created
  ON public.contact_submissions (status, created_at DESC);

DROP POLICY IF EXISTS "Only admins can update contact submissions" ON public.contact_submissions;
CREATE POLICY "Only admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid()) AND public.profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid()) AND public.profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can delete contact submissions" ON public.contact_submissions;
CREATE POLICY "Only admins can delete contact submissions"
  ON public.contact_submissions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid()) AND public.profiles.role = 'admin'
    )
  );

-- 3. Separate Appointments from Blocked Dates & Re-free Cancelled Dates
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_booking_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_booking_date
  ON public.appointments (booking_date)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments (status);

DELETE FROM public.blocked_dates
  WHERE reason = 'Booked via create_booking RPC';

CREATE OR REPLACE FUNCTION public.create_booking(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_car_description TEXT,
  p_booking_date DATE,
  p_service_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_appointment_id UUID;
BEGIN
  -- 1. Check date is not manually blocked by admin
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates
    WHERE blocked_date = p_booking_date
  ) THEN
    RAISE EXCEPTION 'DATE_BLOCKED' USING ERRCODE = '23514';
  END IF;

  -- 2. Insert appointment (TOCTOU-safe: partial unique index catches concurrent active bookings)
  BEGIN
    INSERT INTO public.appointments (
      first_name,
      last_name,
      email,
      phone,
      car_description,
      booking_date,
      status
    )
    VALUES (
      p_first_name,
      p_last_name,
      p_email,
      p_phone,
      p_car_description,
      p_booking_date,
      'pending'
    )
    RETURNING id INTO v_appointment_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'DATE_TAKEN' USING ERRCODE = '23505';
  END;

  -- 3. Insert junction rows
  INSERT INTO public.appointment_services (appointment_id, service_id)
  SELECT v_appointment_id, unnest(p_service_ids);

  -- 4. Return the new appointment id (never inserts into blocked_dates)
  RETURN v_appointment_id;
END;
$$;

-- 4. Atomic Edit Appointment RPC (single transaction for appointment + services)
CREATE OR REPLACE FUNCTION public.update_appointment_with_services(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_car_description TEXT,
  p_booking_date DATE,
  p_status TEXT,
  p_service_ids UUID[]
) RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_unique_ids UUID[];
BEGIN
  UPDATE public.appointments
  SET
    first_name = p_first_name,
    last_name = p_last_name,
    email = p_email,
    phone = p_phone,
    car_description = p_car_description,
    booking_date = p_booking_date,
    status = p_status
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.appointment_services
  WHERE appointment_id = p_id;

  SELECT ARRAY(SELECT DISTINCT unnest(p_service_ids)) INTO v_unique_ids;

  INSERT INTO public.appointment_services (appointment_id, service_id)
  SELECT p_id, unnest(v_unique_ids);
END;
$$;

-- 5. Language-Agnostic Chatbot Knowledge Base
ALTER TABLE public.chatbot_knowledge
  ALTER COLUMN language SET DEFAULT 'any';
