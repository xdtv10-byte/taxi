'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import type { Ride } from '@/types';
import { Header } from '@/components/shared/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Navigation, Star, Clock, Loader2, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  accepted: 'bg-info/15 text-info',
  driver_arrived: 'bg-info/15 text-info',
  in_progress: 'bg-purple-500/15 text-purple-400',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function HistoryPage() {
  const { t, lang } = useTranslation();
  const { user, authLoading } = useApp();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setRides((data as Ride[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('ride_history')}</h1>
            <p className="text-sm text-muted-foreground">
              {rides.length} {lang === 'ar' ? 'رحلة' : 'rides'}
            </p>
          </div>
        </div>

        {rides.length === 0 ? (
          <Card className="border-border p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t('no_rides_yet')}</p>
            <Button asChild className="mt-4 gradient-primary text-white">
              <Link href="/">{t('book_now')}</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => (
              <Link key={ride.id} href={`/track/${ride.id}`}>
                <Card className="border-border p-4 transition-all hover:border-primary/40 hover:bg-secondary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{ride.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="h-4 w-4 shrink-0 text-destructive" />
                        <span className="truncate">{ride.dropoff_address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ride.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                        {ride.customer_rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {ride.customer_rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          statusColors[ride.status]
                        )}
                      >
                        {t(ride.status as any) || ride.status}
                      </span>
                      <div className="text-lg font-bold text-gradient">
                        {ride.actual_fare ?? ride.estimated_fare} {t('sar')}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
