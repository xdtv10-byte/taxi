'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/components/providers';
import { MapPin, Clock, Route } from 'lucide-react';

export function FareEstimate({
  fare,
  distanceKm,
  durationMin,
}: {
  fare: number;
  distanceKm: number;
  durationMin: number;
}) {
  const { t } = useTranslation();
  const { currency } = useApp();

  const displayFare = currency === 'USD' ? `$${(fare / 3.75).toFixed(2)}` : `${fare} ${t('sar')}`;

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('fare_estimate')}
          </div>
          <div className="mt-1 text-3xl font-bold text-gradient">{displayFare}</div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Route className="h-4 w-4 text-primary" />
            <span>{distanceKm.toFixed(1)} {t('km')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{durationMin} {t('min')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
