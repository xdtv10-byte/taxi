'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/components/providers';
import type { RideType } from '@/types';
import { Car, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const rideTypes: { type: RideType; icon: any; multiplier: number }[] = [
  { type: 'economy', icon: Car, multiplier: 1.0 },
  { type: 'comfort', icon: Sparkles, multiplier: 1.5 },
  { type: 'premium', icon: Crown, multiplier: 2.0 },
];

export function RideTypeSelector({
  value,
  onChange,
}: {
  value: RideType;
  onChange: (t: RideType) => void;
}) {
  const { t } = useTranslation();
  const { currency } = useApp();

  const basePrices: Record<RideType, number> = {
    economy: 15,
    comfort: 23,
    premium: 30,
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {rideTypes.map(({ type, icon: Icon, multiplier }) => {
        const selected = value === type;
        const price = Math.ceil(basePrices[type] * (currency === 'USD' ? 0.27 : 1));
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
              selected
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                selected ? 'gradient-primary' : 'bg-secondary group-hover:bg-secondary/80'
              )}
            >
              <Icon className={cn('h-6 w-6', selected ? 'text-white' : 'text-muted-foreground')} />
            </div>
            <div>
              <div className={cn('text-sm font-semibold', selected ? 'text-foreground' : 'text-muted-foreground')}>
                {t(type)}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {currency === 'USD' ? `$${price}` : `${price} ${t('sar')}`}
              </div>
            </div>
            {selected && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>
        );
      })}
    </div>
  );
}
