'use client';

import { useApp } from '@/components/providers';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { lang, setLang } = useApp();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{lang === 'ar' ? 'EN' : 'ع'}</span>
    </Button>
  );
}
