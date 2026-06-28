'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Car, Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { t, lang } = useTranslation();
  const { signIn, loading } = useAuth();
  const { session, profile, authLoading } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect فقط إذا session + profile كلاهما جاهزان
  useEffect(() => {
    if (!authLoading && session && profile) {
      if (profile.user_type === 'admin') router.replace('/admin/dashboard');
      else if (profile.user_type === 'driver') router.replace('/driver/dashboard');
      else router.replace('/');
    }
    // لا تعمل redirect إذا profile = null حتى لو session موجود
    // قد يكون الـ trigger لم ينشئ الصف بعد
  }, [session, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 gradient-hero">
      <div className="absolute top-4 start-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
      </div>

      <Card className="w-full max-w-md border-border glass p-8 animate-fade-in">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary">
              <Car className="h-6 w-6 text-black" strokeWidth={2.2} />
            </div>
            <span className="text-2xl font-bold">
              TAXI<span className="text-gradient font-light">hub</span>
            </span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold">{t('welcome_back')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('login_subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary/50 ps-11 h-12"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary/50 ps-11 pe-11 h-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 text-muted-foreground hover:text-foreground end-3"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/login" className="text-xs text-primary hover:underline">
              {t('forgot_password')}
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading || authLoading}
            className="h-12 w-full gap-2 gradient-primary text-white hover:opacity-90"
          >
            {(loading || authLoading) && <Loader2 className="h-5 w-5 animate-spin" />}
            {t('login')}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t('or')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="outline"
          className="h-12 w-full"
          onClick={() => router.push('/')}
        >
          {t('continue_as_guest')}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('no_account')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('create_account')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
