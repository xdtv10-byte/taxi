'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/components/providers';
import { useRide } from '@/hooks/useRide';
import { supabase } from '@/lib/supabase';
import { calculateFare, haversineKm, estimateDurationMinutes, formatFare } from '@/lib/fareCalculator';
import type { RideType, PaymentMethod, GeoPoint, FareSettings } from '@/types';
import { RideTypeSelector } from './RideTypeSelector';
import { FareEstimate } from './FareEstimate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, ArrowUpDown, Wallet, CreditCard, Banknote, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Suggestion = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

export function BookingForm() {
  const { t, lang } = useTranslation();
  const { user, currency } = useApp();
  const { bookRide, loading } = useRide();
  const router = useRouter();

  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(null);
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [rideType, setRideType] = useState<RideType>('economy');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [settings, setSettings] = useState<FareSettings | null>(null);
  const [locating, setLocating] = useState(false);

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [showPickupSug, setShowPickupSug] = useState(false);
  const [showDropoffSug, setShowDropoffSug] = useState(false);
  const pickupTimer = useRef<any>(null);
  const dropoffTimer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('admin_settings').select('*');
      if (!data) return;
      const map: any = {};
      data.forEach((s: any) => (map[s.setting_key] = s.setting_value));
      setSettings({
        base_fare: parseFloat(map.base_fare ?? '15'),
        per_km_rate: parseFloat(map.per_km_rate ?? '2.5'),
        per_minute_rate: parseFloat(map.per_minute_rate ?? '0.5'),
        currency: map.currency ?? 'SAR',
        max_search_radius: parseFloat(map.max_search_radius ?? '10'),
      });
    })();
  }, []);

  const geocode = async (q: string): Promise<Suggestion[]> => {
    if (q.trim().length < 3) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=${lang}`
      );
      return await res.json();
    } catch {
      return [];
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${lang}`
      );
      const data = await res.json();
      return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const onPickupInput = (v: string) => {
    setPickupInput(v);
    setShowPickupSug(true);
    if (pickupTimer.current) clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      const sugs = await geocode(v);
      setPickupSuggestions(sugs);
    }, 400);
  };

  const onDropoffInput = (v: string) => {
    setDropoffInput(v);
    setShowDropoffSug(true);
    if (dropoffTimer.current) clearTimeout(dropoffTimer.current);
    dropoffTimer.current = setTimeout(async () => {
      const sugs = await geocode(v);
      setDropoffSuggestions(sugs);
    }, 400);
  };

  const selectPickup = (s: Suggestion) => {
    const point: GeoPoint = { lat: parseFloat(s.lat), lng: parseFloat(s.lon), address: s.display_name };
    setPickup(point);
    setPickupInput(s.display_name);
    setShowPickupSug(false);
  };

  const selectDropoff = (s: Suggestion) => {
    const point: GeoPoint = { lat: parseFloat(s.lat), lng: parseFloat(s.lon), address: s.display_name };
    setDropoff(point);
    setDropoffInput(s.display_name);
    setShowDropoffSug(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS غير متاح');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        const point: GeoPoint = { lat: latitude, lng: longitude, address };
        setPickup(point);
        setPickupInput(address);
        setLocating(false);
      },
      () => {
        toast.error('تعذّر تحديد موقعك');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const swap = () => {
    const tmpP = pickup;
    const tmpD = dropoff;
    setPickup(tmpD);
    setDropoff(tmpP);
    setPickupInput(tmpD?.address ?? '');
    setDropoffInput(tmpP?.address ?? '');
  };

  const distance = pickup && dropoff ? haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 0;
  const duration = estimateDurationMinutes(distance);
  const fare =
    pickup && dropoff && settings
      ? calculateFare(distance, duration, rideType, settings)
      : 0;

  const handleBook = async () => {
    if (!user) {
      toast.info(t('login_to_book'));
      router.push('/login');
      return;
    }
    if (!pickup || !dropoff) {
      toast.error(lang === 'ar' ? 'حدد نقطة الانطلاق والوجهة' : 'Set pickup and destination');
      return;
    }
    if (!settings) return;

    const ride = await bookRide({
      pickup,
      dropoff,
      ride_type: rideType,
      payment_method: paymentMethod,
      estimated_fare: fare,
      distance_km: distance,
      duration_minutes: duration,
    });

    if (ride) {
      // ✅ فتح رابط الدفع فقط عند card أو wallet — ليس عند cash
      if (paymentMethod === 'card' || paymentMethod === 'wallet') {
        const checkoutUrl = `https://pay.taxihub.live/l/egbusl?price=${fare}`;
        window.open(checkoutUrl, '_blank');
      }

      router.push(`/track/${ride.id}`);
    }
  };

  const paymentOptions: { method: PaymentMethod; icon: any; label: string }[] = [
    { method: 'cash', icon: Banknote, label: t('cash') },
    { method: 'card', icon: CreditCard, label: t('card') },
    { method: 'wallet', icon: Wallet, label: t('wallet') },
  ];

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      {/* Pickup / Dropoff */}
      <div className="relative space-y-3">
        <div className="relative">
          <MapPin className="absolute top-3.5 h-5 w-5 text-primary start-3" />
          <Input
            value={pickupInput}
            onChange={(e) => onPickupInput(e.target.value)}
            onFocus={() => setShowPickupSug(true)}
            onBlur={() => setTimeout(() => setShowPickupSug(false), 200)}
            placeholder={t('pickup')}
            className="bg-secondary/50 border-border ps-11 h-12"
          />
          {showPickupSug && pickupSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              {pickupSuggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onMouseDown={() => selectPickup(s)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-start text-sm hover:bg-secondary/60"
                >
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-muted-foreground">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Navigation className="absolute top-3.5 h-5 w-5 text-destructive start-3" />
          <Input
            value={dropoffInput}
            onChange={(e) => onDropoffInput(e.target.value)}
            onFocus={() => setShowDropoffSug(true)}
            onBlur={() => setTimeout(() => setShowDropoffSug(false), 200)}
            placeholder={t('dropoff')}
            className="bg-secondary/50 border-border ps-11 h-12"
          />
          {showDropoffSug && dropoffSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              {dropoffSuggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onMouseDown={() => selectDropoff(s)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-start text-sm hover:bg-secondary/60"
                >
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-muted-foreground">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating}
            className="gap-2"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="text-xs">{t('use_current_location')}</span>
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={swap} className="h-9 w-9">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ride type */}
      <div className="mt-5">
        <div className="mb-2.5 text-sm font-medium text-muted-foreground">{t('ride_type')}</div>
        <RideTypeSelector value={rideType} onChange={setRideType} />
      </div>

      {/* Payment */}
      <div className="mt-5">
        <div className="mb-2.5 text-sm font-medium text-muted-foreground">{t('payment_method')}</div>
        <div className="grid grid-cols-3 gap-2">
          {paymentOptions.map(({ method, icon: Icon, label }) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all',
                paymentMethod === method
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Fare estimate */}
      {pickup && dropoff && settings && (
        <div className="mt-5 animate-fade-in">
          <FareEstimate fare={fare} distanceKm={distance} durationMin={duration} />
        </div>
      )}

      {/* ملاحظة الدفع حسب الطريقة المختارة */}
      {paymentMethod === 'card' && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-info/20 bg-info/5 px-4 py-2.5 text-xs text-muted-foreground animate-fade-in">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <span>
            {lang === 'ar'
              ? 'يُدفع 50% من قيمة الرحلة عند الحجز، و50% قبل الوصول إلى الوجهة.'
              : '50% of the fare is charged at booking, and 50% before arrival at your destination.'}
          </span>
        </div>
      )}

      {paymentMethod === 'cash' && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2.5 text-xs text-muted-foreground animate-fade-in">
          <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <span>
            {lang === 'ar'
              ? 'الدفع نقداً عند الوصول — لا حاجة لبطاقة.'
              : 'Pay cash on arrival — no card required.'}
          </span>
        </div>
      )}

      {paymentMethod === 'wallet' && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground animate-fade-in">
          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            {lang === 'ar'
              ? 'سيتم خصم المبلغ من محفظتك الإلكترونية عند تأكيد الحجز.'
              : 'Amount will be deducted from your wallet upon booking confirmation.'}
          </span>
        </div>
      )}

      {/* Book button */}
      <Button
        onClick={handleBook}
        disabled={loading || !pickup || !dropoff}
        className="mt-3 h-12 w-full gap-2 gradient-primary text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {t('book_now')}
      </Button>
    </div>
  );
}
