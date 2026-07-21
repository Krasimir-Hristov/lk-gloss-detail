-- ============================================
-- Atomic booking RPC: inserts appointment + junction rows in one transaction
-- Pre-checks: date not already booked, date not blocked
-- ============================================

CREATE OR REPLACE FUNCTION create_booking(
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
  v_blocked_count INTEGER;
BEGIN
  -- 1. Check date is not blocked (admin can block via dashboard)
  SELECT COUNT(*) INTO v_blocked_count
  FROM public.blocked_dates
  WHERE blocked_date = p_booking_date;

  IF v_blocked_count > 0 THEN
    RAISE EXCEPTION 'DATE_BLOCKED' USING ERRCODE = '23514';
  END IF;

  -- 2. Insert appointment (TOCTOU-safe: unique constraint catches concurrent bookings)
  BEGIN
    INSERT INTO public.appointments (first_name, last_name, email, phone, car_description, booking_date, status)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_car_description, p_booking_date, 'pending')
    RETURNING id INTO v_appointment_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'DATE_TAKEN' USING ERRCODE = '23505';
  END;

  -- 3. Insert junction rows
  INSERT INTO public.appointment_services (appointment_id, service_id)
  SELECT v_appointment_id, unnest(p_service_ids);

  -- 4. Block the date so it cannot be booked again
  INSERT INTO public.blocked_dates (blocked_date, reason)
  VALUES (p_booking_date, 'Booked via create_booking RPC')
  ON CONFLICT (blocked_date) DO NOTHING;

  -- 5. Return the new appointment id
  RETURN v_appointment_id;
END;
$$;