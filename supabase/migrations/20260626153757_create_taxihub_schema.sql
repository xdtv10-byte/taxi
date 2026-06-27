/*
# TaxiHub — full schema

1. New Tables
- `users`: profile rows mirroring auth.users, with user_type (customer/driver/admin), name, phone, is_active.
- `drivers`: driver-specific data — license, vehicle make/model/year/color/plate, vehicle_type, availability, live GPS coords, rating, total_rides, status.
- `rides`: a booking — customer + driver, pickup/dropoff (address + lat/lng), ride_type, payment_method, estimated/actual fare, distance/duration, status lifecycle, ratings + feedback, lifecycle timestamps.
- `ride_tracking`: per-ride GPS breadcrumbs for the driver (lat/lng + timestamp).
- `admin_settings`: key/value config (base_fare, per_km_rate, per_minute_rate, currency, max_search_radius).

2. Security (RLS)
- This app HAS a sign-in screen (login/register), so policies are scoped `TO authenticated` with ownership checks.
- `users`: all authenticated can read; a user can insert/update their own profile row (id = auth.uid()).
- `drivers`: owner (user_id = auth.uid()) can insert/update; all authenticated can read.
- `rides`: customer (customer_id = auth.uid()) and assigned driver (driver_id = auth.uid()) can read. Customer can insert (defaults customer_id to auth.uid()) and update. Driver can update when assigned. Admins can do everything.
- `ride_tracking`: assigned driver can insert; customer + driver of the ride can read.
- `admin_settings`: all authenticated can read; only admins can write.

3. Important notes
- `users.id` and `drivers.user_id` reference auth.users(id) so profiles are tied to real auth accounts.
- `rides.customer_id` defaults to auth.uid() so the booking insert omits it client-side.
- Idempotent: uses IF NOT EXISTS for tables; policies are dropped-then-created.
- Default admin_settings rows are inserted with ON CONFLICT DO NOTHING.
*/

-- ===== users =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  profile_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all_authenticated" ON users;
CREATE POLICY "users_select_all_authenticated" ON users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===== drivers =====
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) NOT NULL,
  vehicle_make VARCHAR(50) NOT NULL,
  vehicle_model VARCHAR(50) NOT NULL,
  vehicle_year INT NOT NULL,
  vehicle_color VARCHAR(30) NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_type TEXT CHECK (vehicle_type IN ('economy', 'comfort', 'premium')) DEFAULT 'economy',
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INT DEFAULT 0,
  status TEXT CHECK (status IN ('offline', 'online', 'busy')) DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_select_all_authenticated" ON drivers;
CREATE POLICY "drivers_select_all_authenticated" ON drivers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "drivers_insert_own" ON drivers;
CREATE POLICY "drivers_insert_own" ON drivers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "drivers_update_own" ON drivers;
CREATE POLICY "drivers_update_own" ON drivers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== rides =====
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10,8) NOT NULL,
  dropoff_lng DECIMAL(11,8) NOT NULL,
  ride_type TEXT CHECK (ride_type IN ('economy', 'comfort', 'premium')) DEFAULT 'economy',
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'wallet')) DEFAULT 'cash',
  estimated_fare DECIMAL(10,2),
  actual_fare DECIMAL(10,2),
  distance_km DECIMAL(8,2),
  duration_minutes INT,
  status TEXT CHECK (status IN ('pending','accepted','driver_arrived','in_progress','completed','cancelled')) DEFAULT 'pending',
  customer_rating INT,
  driver_rating INT,
  customer_feedback TEXT,
  driver_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rides_select_participants" ON rides;
CREATE POLICY "rides_select_participants" ON rides
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "rides_insert_own_customer" ON rides;
CREATE POLICY "rides_insert_own_customer" ON rides
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "rides_update_participants" ON rides;
CREATE POLICY "rides_update_participants" ON rides
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

-- ===== ride_tracking =====
CREATE TABLE IF NOT EXISTS ride_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_lat DECIMAL(10,8) NOT NULL,
  driver_lng DECIMAL(11,8) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ride_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_select_participants" ON ride_tracking;
CREATE POLICY "tracking_select_participants" ON ride_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_tracking.ride_id AND rides.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_tracking.ride_id AND rides.driver_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "tracking_insert_driver" ON ride_tracking;
CREATE POLICY "tracking_insert_driver" ON ride_tracking
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_tracking.ride_id AND rides.driver_id = auth.uid())
  );

-- ===== admin_settings =====
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_authenticated" ON admin_settings;
CREATE POLICY "settings_select_authenticated" ON admin_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON admin_settings;
CREATE POLICY "settings_update_admin" ON admin_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin'));

DROP POLICY IF EXISTS "settings_insert_admin" ON admin_settings;
CREATE POLICY "settings_insert_admin" ON admin_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin'));

-- ===== default settings =====
INSERT INTO admin_settings (setting_key, setting_value) VALUES
  ('base_fare', '15'),
  ('per_km_rate', '2.5'),
  ('per_minute_rate', '0.5'),
  ('currency', 'SAR'),
  ('max_search_radius', '10')
ON CONFLICT (setting_key) DO NOTHING;

-- ===== indexes =====
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_ride_tracking_ride_id ON ride_tracking(ride_id);

-- ===== realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_tracking;
