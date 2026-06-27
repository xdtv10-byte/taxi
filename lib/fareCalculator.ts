import type { FareSettings, RideType } from '@/types';

const rideTypeMultiplier: Record<RideType, number> = {
  economy: 1.0,
  comfort: 1.5,
  premium: 2.0,
};

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  rideType: RideType,
  settings: Pick<FareSettings, 'base_fare' | 'per_km_rate' | 'per_minute_rate'>
): number {
  const base = settings.base_fare;
  const distance = distanceKm * settings.per_km_rate;
  const time = durationMinutes * settings.per_minute_rate;
  const multiplier = rideTypeMultiplier[rideType] ?? 1.0;
  return Math.ceil((base + distance + time) * multiplier);
}

// Haversine distance in km
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Rough duration estimate: assume average 35 km/h in city
export function estimateDurationMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / 35) * 60));
}

export function formatFare(amount: number, currency: string): string {
  if (currency === 'USD') {
    return `$${(amount / 3.75).toFixed(2)}`;
  }
  return `${amount.toFixed(0)} ر.س`;
}
