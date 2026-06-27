'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Car, CarFront, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DriverLoginPage() {
  const { t, lang } = useTranslation();
  const { session, profile, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && session && profile) {
      if (profile.user_type === 'driver') router.push('/driver/dashboard');
      else if (profile.user_type === 'admin') router.push('/admin/dashboard');
      else router.push('/');
    }
  }, [session, profile, authLoading, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 gradient-hero">
      <div className="absolute top-4 start-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
      </div>

      <Card className="w-full max-w-md border-border glass p-8 animate-fade-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
            <CarFront className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('driver_portal')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === 'ar' ? 'سجّل الدخول كبائق لبدء العمل' : 'Sign in as a driver to start earning'}
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="h-12 w-full gap-2 gradient-primary text-white hover:opacity-90">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full">
            <Link href="/register">{t('create_account')}</Link>
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Car className="h-4 w-4 text-primary" />
          <span>TaxiHub {lang === 'ar' ? 'للسائقين' : 'for Drivers'}</span>
        </div>
      </Card>
    </div>
  );
}
