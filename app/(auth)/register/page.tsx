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
import { Car, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowLeft, CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserType, VehicleType } from '@/types';

export default function RegisterPage() {
  const { t, lang } = useTranslation();
  const { signUp, loading } = useAuth();
  const { session, profile, authLoading } = useApp();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'customer' as UserType,
  });
  const [driverForm, setDriverForm] = useState({
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    vehicle_plate: '',
    vehicle_type: 'economy' as VehicleType,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && session && profile) {
      if (profile.user_type === 'admin') router.push('/admin/dashboard');
      else if (profile.user_type === 'driver') router.push('/driver/dashboard');
      else router.push('/');
    }
  }, [session, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (form.userType === 'driver') {
      if (!driverForm.license_number || !driverForm.vehicle_make || !driverForm.vehicle_plate) {
        toast.error(lang === 'ar' ? 'أكمل بيانات المركبة' : 'Complete vehicle info');
        return;
      }
    }
    const { error } = await signUp({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      user_type: form.userType,
      driver:
        form.userType === 'driver'
          ? {
              license_number: driverForm.license_number,
              vehicle_make: driverForm.vehicle_make,
              vehicle_model: driverForm.vehicle_model,
              vehicle_year: parseInt(driverForm.vehicle_year) || new Date().getFullYear(),
              vehicle_color: driverForm.vehicle_color,
              vehicle_plate: driverForm.vehicle_plate,
              vehicle_type: driverForm.vehicle_type,
            }
          : undefined,
    });
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 gradient-hero">
      <div className="absolute top-4 start-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
      </div>

      <Card className="w-full max-w-lg border-border glass p-8 animate-fade-in">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">
              Taxi<span className="text-gradient">Hub</span>
            </span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold">{t('create_account')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('register_subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Account type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">{t('account_type')}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['customer', 'driver'] as UserType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, userType: type })}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all',
                    form.userType === type
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {type === 'customer' ? <User className="h-4 w-4" /> : <CarFront className="h-4 w-4" />}
                  {t(type as any)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('full_name')}</label>
            <div className="relative">
              <User className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/50 ps-11 h-12"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-secondary/50 ps-11 h-12"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('phone')}</label>
              <div className="relative">
                <Phone className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+9665xxxxxxxx"
                  className="bg-secondary/50 ps-11 h-12"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('confirm_password')}</label>
              <div className="relative">
                <Lock className="absolute top-3 h-5 w-5 text-muted-foreground start-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="bg-secondary/50 ps-11 h-12"
                />
              </div>
            </div>
          </div>

          {/* Driver fields */}
          {form.userType === 'driver' && (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CarFront className="h-4 w-4" />
                {t('vehicle_info')}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('license_number')}</label>
                  <Input
                    required
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    className="bg-secondary/50 h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_plate')}</label>
                  <Input
                    required
                    value={driverForm.vehicle_plate}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_plate: e.target.value })}
                    className="bg-secondary/50 h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_make')}</label>
                  <Input
                    required
                    value={driverForm.vehicle_make}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_make: e.target.value })}
                    placeholder="Toyota"
                    className="bg-secondary/50 h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_model')}</label>
                  <Input
                    value={driverForm.vehicle_model}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_model: e.target.value })}
                    placeholder="Camry"
                    className="bg-secondary/50 h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_year')}</label>
                  <Input
                    type="number"
                    value={driverForm.vehicle_year}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_year: e.target.value })}
                    placeholder="2022"
                    className="bg-secondary/50 h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_color')}</label>
                  <Input
                    value={driverForm.vehicle_color}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle_color: e.target.value })}
                    placeholder={lang === 'ar' ? 'أبيض' : 'White'}
                    className="bg-secondary/50 h-11"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t('vehicle_type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['economy', 'comfort', 'premium'] as VehicleType[]).map((vt) => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, vehicle_type: vt })}
                      className={cn(
                        'rounded-lg border py-2 text-xs font-medium transition-all',
                        driverForm.vehicle_type === vt
                          ? 'border-primary bg-primary/15 text-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      {t(vt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full gap-2 gradient-primary text-white hover:opacity-90"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {t('create_account')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('no_account')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('login')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
