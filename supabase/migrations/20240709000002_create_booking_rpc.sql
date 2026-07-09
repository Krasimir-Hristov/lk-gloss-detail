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
  v_existing_count INTEGER;
  v_blocked_count INTEGER;
BEGIN
  -- 1. Check date is not already taken
  SELECT COUNT(*) INTO v_existing_count
  FROM public.appointments
  WHERE booking_date = p_booking_date;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'DATE_TAKEN' USING ERRCODE = '23505';
  END IF;

  -- 2. Check date is not blocked
  SELECT COUNT(*) INTO v_blocked_count
  FROM public.blocked_dates
  WHERE blocked_date = p_booking_date;

  IF v_blocked_count > 0 THEN
    RAISE EXCEPTION 'DATE_BLOCKED' USING ERRCODE = '23514';
  END IF;

  -- 3. Insert appointment
  INSERT INTO public.appointments (first_name, last_name, email, phone, car_description, booking_date, status)
  VALUES (p_first_name, p_last_name, p_email, p_phone, p_car_description, p_booking_date, 'confirmed')
  RETURNING id INTO v_appointment_id;

  -- 4. Insert junction rows
  INSERT INTO public.appointment_services (appointment_id, service_id)
  SELECT v_appointment_id, unnest(p_service_ids);

  -- 5. Block the date so it cannot be booked again
  INSERT INTO public.blocked_dates (blocked_date, reason)
  VALUES (p_booking_date, 'Booked via create_booking RPC')
  ON CONFLICT (blocked_date) DO NOTHING;

  -- 6. Return the new appointment id
  RETURN v_appointment_id;
END;
$$;