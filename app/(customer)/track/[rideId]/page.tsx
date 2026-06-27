'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { LeafletMap } from '@/components/map/LeafletMap';
import type { Ride, Driver, UserProfile, GeoPoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Phone, X, Star, Car, Clock, MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusOrder = ['pending', 'accepted', 'driver_arrived', 'in_progress', 'completed'];

export default function TrackRidePage({ params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = use(params);
  const { t, lang } = useTranslation();
  const { user } = useApp();
  const router = useRouter();

  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverUser, setDriverUser] = useState<UserProfile | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .maybeSingle();
      if (!data) {
        setLoading(false);
        return;
      }
      setRide(data as Ride);
      setLoading(false);

      if ((data as Ride).driver_id) {
        const { data: d } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', (data as Ride).driver_id!)
          .maybeSingle();
        setDriver(d as Driver | null);
        const { data: du } = await supabase
          .from('users')
          .select('*')
          .eq('id', (data as Ride).driver_id!)
          .maybeSingle();
        setDriverUser(du as UserProfile | null);
      }
    })();

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        (payload) => {
          const newRide = payload.new as Ride;
          setRide(newRide);
          if (newRide.driver_id && !driver) {
            (async () => {
              const { data: d } = await supabase
                .from('drivers')
                .select('*')
                .eq('user_id', newRide.driver_id)
                .maybeSingle();
              setDriver(d as Driver | null);
              const { data: du } = await supabase
                .from('users')
                .select('*')
                .eq('id', newRide.driver_id)
                .maybeSingle();
              setDriverUser(du as UserProfile | null);
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_tracking', filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const tr = payload.new as any;
          setDriverLocation({ lat: parseFloat(tr.driver_lat), lng: parseFloat(tr.driver_lng) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  const cancelRide = async () => {
    if (!ride) return;
    const { error } = await supabase.from('rides').update({ status: 'cancelled' }).eq('id', ride.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('status_cancelled'));
    router.push('/history');
  };

  const submitRating = async () => {
    if (!ride || rating === 0) return;
    const { error } = await supabase
      .from('rides')
      .update({ customer_rating: rating, customer_feedback: feedback })
      .eq('id', ride.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === 'ar' ? 'شكراً لتقييمك' : 'Thanks for rating');
    setShowRating(false);
    router.push('/history');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{lang === 'ar' ? 'الرحلة غير موجودة' : 'Ride not found'}</p>
        <Button asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    );
  }

  const pickup: GeoPoint = { lat: ride.pickup_lat, lng: ride.pickup_lng, address: ride.pickup_address };
  const dropoff: GeoPoint = { lat: ride.dropoff_lat, lng: ride.dropoff_lng, address: ride.dropoff_address };
  const currentStep = statusOrder.indexOf(ride.status);

  const statusLabels: Record<string, string> = {
    pending: t('status_pending'),
    accepted: t('status_accepted'),
    driver_arrived: t('status_driver_arrived'),
    in_progress: t('status_in_progress'),
    completed: t('status_completed'),
    cancelled: t('status_cancelled'),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 glass-strong border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-lg font-bold">{t('tracking_ride')}</h1>
          <div className="ms-auto">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                ride.status === 'completed' && 'bg-success/15 text-success',
                ride.status === 'cancelled' && 'bg-destructive/15 text-destructive',
                !['completed', 'cancelled'].includes(ride.status) && 'bg-primary/15 text-primary'
              )}
            >
              {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              )}
              {statusLabels[ride.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border p-0">
            <LeafletMap
              center={[ride.pickup_lat, ride.pickup_lng]}
              zoom={13}
              pickupLocation={pickup}
              dropoffLocation={dropoff}
              driverLocation={driverLocation}
              height="500px"
            />
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Status timeline */}
          {ride.status !== 'cancelled' && (
            <Card className="border-border p-5">
              <div className="space-y-3">
                {statusOrder.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep && ride.status !== 'completed';
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                          done ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground',
                          active && 'ring-4 ring-primary/20'
                        )}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <div className={cn('text-sm', done ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {statusLabels[step]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Driver info */}
          {driver && driverUser && (
            <Card className="border-border p-5 animate-fade-in">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">
                    {driverUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{driverUser.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span>{Number(driver.rating).toFixed(1)}</span>
                    <span className="mx-1">·</span>
                    <span>{driver.total_rides} {lang === 'ar' ? 'رحلة' : 'rides'}</span>
                  </div>
                </div>
                <Button size="icon" asChild className="rounded-full gradient-primary text-white">
                  <a href={`tel:${driverUser.phone}`}><Phone className="h-4 w-4" /></a>
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="font-medium">{driver.vehicle_make} {driver.vehicle_model}</span>
                  </div>
                  <span className="text-muted-foreground">{driver.vehicle_color}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('vehicle_plate')}</span>
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono font-bold text-primary">
                    {driver.vehicle_plate}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Ride details */}
          <Card className="border-border p-5">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('pickup')}</div>
                  <div className="font-medium">{ride.pickup_address}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('dropoff')}</div>
                  <div className="font-medium">{ride.dropoff_address}</div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{ride.duration_minutes} {t('min')}</span>
                </div>
                <div className="text-lg font-bold text-gradient">
                  {ride.estimated_fare} {t('sar')}
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {ride.status === 'completed' && !ride.customer_rating && (
            <Button onClick={() => setShowRating(true)} className="w-full gradient-primary text-white">
              {t('rate_ride')}
            </Button>
          )}
          {!['completed', 'cancelled'].includes(ride.status) && (
            <Button
              onClick={cancelRide}
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              {t('cancel_ride')}
            </Button>
          )}
        </div>
      </div>

      {/* Rating modal */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border p-6">
            <h3 className="text-lg font-bold">{t('rate_ride')}</h3>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-9 w-9',
                      n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedback')}
              className="mt-4 w-full rounded-xl border border-border bg-secondary/50 p-3 text-sm outline-none focus:border-primary"
              rows={3}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setShowRating(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={submitRating} disabled={rating === 0} className="flex-1 gradient-primary text-white">
                {t('submit_rating')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
