'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import type { UserType, VehicleType } from '@/types';
import { toast } from 'sonner';

type SignUpInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  user_type: UserType;
  driver?: {
    license_number: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_color: string;
    vehicle_plate: string;
    vehicle_type: VehicleType;
  };
};

export function useAuth() {
  const { session, profile, authLoading, refreshProfile, signOut } = useApp();
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // بعد تسجيل الدخول مباشرة — تأكد أن الصف موجود وإلا أنشئه
      if (data.user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existing) {
          // الصف غير موجود — أنشئه الآن (المستخدم مسجّل دخول فـ RLS يسمح)
          const meta = data.user.user_metadata;
          await supabase.from('users').insert({
            id: data.user.id,
            name: meta?.name || data.user.email?.split('@')[0] || 'مستخدم',
            email: data.user.email!,
            phone: meta?.phone || '',
            user_type: meta?.user_type || 'customer',
          });
        }
      }

      toast.success('تم تسجيل الدخول بنجاح');
      return { error: null };
    } catch (e: any) {
      toast.error(e.message || 'فشل تسجيل الدخول');
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (input: SignUpInput) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            phone: input.phone,
            user_type: input.user_type,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('فشل إنشاء الحساب');

      // إذا لا يوجد تأكيد إيميل (session موجود فوراً) — أنشئ الصف مباشرة
      if (data.session) {
        await supabase.from('users').upsert({
          id: data.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          user_type: input.user_type,
        }, { onConflict: 'id' });

        if (input.user_type === 'driver' && input.driver) {
          await supabase.from('drivers').upsert({
            user_id: data.user.id,
            ...input.driver,
          }, { onConflict: 'user_id' });
        }

        toast.success('تم إنشاء الحساب بنجاح');
      } else {
        // تأكيد إيميل مطلوب — الـ trigger سينشئ الصف بعد التفعيل
        toast.success('تم الإرسال! تحقق من بريدك الإلكتروني لتفعيل الحساب.');
      }

      return { error: null, needsEmailConfirmation: !data.session };
    } catch (e: any) {
      toast.error(e.message || 'فشل إنشاء الحساب');
      return { error: e, needsEmailConfirmation: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    profile,
    authLoading,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
