'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { useDriver } from '@/hooks/useDriver';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LeafletMap } from '@/components/map/LeafletMap';
import {
  Car, LogOut, Star, MapPin, Navigation, Phone, Clock, DollarSign,
  TrendingUp, CheckCircle2, X, Loader2, ArrowLeft, CarFront, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DriverDashboardPage() {
  const { t, lang } = useTranslation();
  const { profile, authLoading, signOut } = useApp();
  const {
    driver, pendingRides, activeRide, todayStats, loading,
    setStatus, acceptRide, updateRideStatus, updateLocation, fetchDriver,
  } = useDriver();
  const router = useRouter();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!authLoading && !profile) router.push('/driver-portal');
    if (!authLoading && profile && profile.user_type !== 'driver' && profile.user_type !== 'admin') {
      router.push('/');
    }
  }, [profile, authLoading, router]);

  // Auto location tracking when online
  useEffect(() => {
    if (!driver || driver.status === 'offline') return;
    if (!navigator.geolocation) return;

    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      setLocating(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.status]);

  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // لم يتم إنشاء حساب سائق بعد
  if (!driver && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
          <Car className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {lang === 'ar' ? 'لم يتم العثور على ملف السائق' : 'Driver Profile Not Found'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'حسابك مسجّل كـ سائق لكن لا يوجد ملف سائق. تواصل مع الإدارة أو سجّل من بوابة السائق.'
              : 'Your account is set as driver but no driver profile exists. Please register via the driver portal.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/driver-portal">
              {lang === 'ar' ? 'بوابة السائق' : 'Driver Portal'}
            </Link>
          </Button>
          <Button onClick={() => fetchDriver()} className="gradient-primary text-white">
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
        <Button variant="ghost" onClick={async () => { await signOut(); router.push('/'); }} className="text-muted-foreground">
          <LogOut className="me-2 h-4 w-4" />
          {lang === 'ar' ? 'تسجيل خروج' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  if (loading || !driver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOnline = driver.status === 'online' || driver.status === 'busy';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const stats = [
    { icon: Car, label: t('today_rides'), value: todayStats.rides, color: 'text-primary' },
    { icon: DollarSign, label: t('today_earnings'), value: `${todayStats.earnings} ${t('sar')}`, color: 'text-success' },
    { icon: Star, label: t('avg_rating'), value: Number(driver.rating).toFixed(1), color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('driver_dashboard')}</div>
              <div className="text-xs text-muted-foreground">{profile.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Status toggle */}
        <Card className="mb-6 border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  isOnline ? 'bg-success/15' : 'bg-secondary'
                )}
              >
                <Zap className={cn('h-6 w-6', isOnline ? 'text-success' : 'text-muted-foreground')} />
              </div>
              <div>
                <div className="text-lg font-bold">{isOnline ? t('online') : t('offline')}</div>
                <div className="text-xs text-muted-foreground">
                  {locating
                    ? (lang === 'ar' ? 'يتم تحديث موقعك...' : 'Updating location...')
                    : (lang === 'ar' ? 'اضغط لتغيير حالتك' : 'Toggle to change status')}
                </div>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={(checked) => setStatus(checked ? 'online' : 'offline')}
              disabled={loading || driver.status === 'busy'}
            />
          </div>
        </Card>

        {/* Today stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, label, value, color }, i) => (
            <Card key={i} className="border-border p-4">
              <Icon className={cn('h-5 w-5', color)} />
              <div className="mt-2 text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>

        {/* Vehicle info */}
        <Card className="mb-6 border-border p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CarFront className="h-4 w-4 text-primary" />
            {t('vehicle_details')}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">{t('vehicle_make')}</div>
              <div className="font-medium">{driver.vehicle_make} {driver.vehicle_model}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('vehicle_color')}</div>
              <div className="font-medium">{driver.vehicle_color}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('vehicle_year')}</div>
              <div className="font-medium">{driver.vehicle_year}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('vehicle_plate')}</div>
              <div className="font-mono font-bold text-primary">{driver.vehicle_plate}</div>
            </div>
          </div>
        </Card>

        {/* Active ride */}
        {activeRide && (
          <Card className="mb-6 border-primary/40 bg-primary/5 p-5 animate-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {t('current_ride')}
              </div>
              <span className="text-xs text-muted-foreground">
                {t(activeRide.status as any) || activeRide.status}
              </span>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{activeRide.pickup_address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{activeRide.dropoff_address}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">{activeRide.distance_km} {t('km')}</span>
                <span className="text-lg font-bold text-gradient">{activeRide.estimated_fare} {t('sar')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeRide.status === 'accepted' && (
                <Button
                  onClick={() => updateRideStatus(activeRide.id, 'driver_arrived')}
                  disabled={loading}
                  className="gap-2 gradient-primary text-white"
                >
                  <MapPin className="h-4 w-4" />
                  {t('arrived')}
                </Button>
              )}
              {activeRide.status === 'driver_arrived' && (
                <Button
                  onClick={() => updateRideStatus(activeRide.id, 'in_progress')}
                  disabled={loading}
                  className="gap-2 gradient-primary text-white"
                >
                  <Navigation className="h-4 w-4" />
                  {t('start_ride')}
                </Button>
              )}
              {activeRide.status === 'in_progress' && (
                <Button
                  onClick={() => updateRideStatus(activeRide.id, 'completed')}
                  disabled={loading}
                  className="gap-2 bg-success text-white hover:opacity-90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('complete_ride')}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Pending rides */}
        {!activeRide && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Clock className="h-5 w-5 text-primary" />
              {t('pending_rides')}
              {pendingRides.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  {pendingRides.length}
                </span>
              )}
            </h2>

            {pendingRides.length === 0 ? (
              <Card className="border-border p-10 text-center">
                <Car className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">{t('no_pending_rides')}</p>
                {!isOnline && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lang === 'ar' ? 'فعّل وضع "متاح" لاستقبال الطلبات' : 'Go online to receive requests'}
                  </p>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRides.map((ride) => (
                  <Card key={ride.id} className="border-border p-4 transition-all hover:border-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">{ride.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 shrink-0 text-destructive" />
                          <span className="truncate">{ride.dropoff_address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{ride.distance_km} {t('km')}</span>
                          <span>·</span>
                          <span>{t(ride.ride_type as any) || ride.ride_type}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-lg font-bold text-gradient">
                          {ride.estimated_fare} {t('sar')}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => acceptRide(ride.id)}
                          disabled={loading}
                          className="gap-1 gradient-primary text-white"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t('accept_ride')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
