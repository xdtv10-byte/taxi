export type UserType = 'customer' | 'driver' | 'admin';

export type RideType = 'economy' | 'comfort' | 'premium';
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type DriverStatus = 'offline' | 'online' | 'busy';
export type VehicleType = 'economy' | 'comfort' | 'premium';

export type GeoPoint = {
  lat: number;
  lng: number;
  address: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: UserType;
  profile_image: string | null;
  is_active: boolean;
  created_at: string;
};

export type Driver = {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  vehicle_type: VehicleType;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_rides: number;
  status: DriverStatus;
  created_at: string;
  // joined
  name?: string;
  profile_image?: string | null;
  phone?: string;
};

export type Ride = {
  id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  ride_type: RideType;
  payment_method: PaymentMethod;
  estimated_fare: number | null;
  actual_fare: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  status: RideStatus;
  customer_rating: number | null;
  driver_rating: number | null;
  customer_feedback: string | null;
  driver_feedback: string | null;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  // joined
  customer_name?: string;
  customer_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_profile_image?: string | null;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
  vehicle_type?: VehicleType;
};

export type RideTracking = {
  id: string;
  ride_id: string;
  driver_lat: number;
  driver_lng: number;
  timestamp: string;
};

export type AdminSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
};

export type FareSettings = {
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  currency: string;
  max_search_radius: number;
};
