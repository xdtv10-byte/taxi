'use client';

import { useApp } from '@/components/providers';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CurrencySelector() {
  const { currency, setCurrency } = useApp();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setCurrency(currency === 'SAR' ? 'USD' : 'SAR')}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <DollarSign className="h-4 w-4" />
      <span className="text-sm font-medium">{currency}</span>
    </Button>
  );
}
