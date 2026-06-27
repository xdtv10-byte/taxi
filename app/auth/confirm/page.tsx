'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      // Supabase يُرسل token_hash و type في الـ URL
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;
      const code = searchParams.get('code');

      try {
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          throw new Error('رابط التفعيل غير صحيح');
        }
        setStatus('success');
        // توجيه تلقائي بعد 3 ثواني
        setTimeout(() => router.push('/login'), 3000);
      } catch (e: any) {
        setStatus('error');
        setErrorMsg(e.message || 'فشل تفعيل الحساب');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 gradient-hero">
      <Card className="w-full max-w-md border-border glass p-8 text-center animate-fade-in">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold">
            Taxi<span className="text-gradient">Hub</span>
          </span>
        </Link>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
            <h2 className="text-lg font-bold">جارٍ تفعيل حسابك...</h2>
            <p className="text-sm text-muted-foreground">لحظة من فضلك</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-xl font-bold">تم تفعيل حسابك! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              يمكنك الآن تسجيل الدخول والاستمتاع بخدمات TaxiHub.
            </p>
            <p className="text-xs text-muted-foreground">
              سيتم توجيهك تلقائياً خلال ثوانٍ...
            </p>
            <Button asChild className="w-full gradient-primary text-white">
              <Link href="/login">تسجيل الدخول الآن</Link>
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">فشل التفعيل</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">
              قد يكون الرابط منتهي الصلاحية. حاول التسجيل مجدداً.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/register">تسجيل جديد</Link>
              </Button>
              <Button asChild className="flex-1 gradient-primary text-white">
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
