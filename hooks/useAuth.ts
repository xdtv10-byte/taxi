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

      if (data.user) {
        const meta = data.user.user_metadata;

        // تأكد أن صف users موجود
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('users').insert({
            id: data.user.id,
            name: meta?.name || data.user.email?.split('@')[0] || 'مستخدم',
            email: data.user.email!,
            phone: meta?.phone || '',
            user_type: meta?.user_type || 'customer',
          });
        }

        // إذا كان سائقاً — تأكد أن بيانات السائق موجودة
        if (meta?.user_type === 'driver') {
          const { data: driverExists } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!driverExists && meta?.driver_data) {
            try {
              const driverData = typeof meta.driver_data === 'string'
                ? JSON.parse(meta.driver_data)
                : meta.driver_data;

              await supabase.from('drivers').insert({
                user_id: data.user.id,
                license_number: driverData.license_number,
                vehicle_make: driverData.vehicle_make,
                vehicle_model: driverData.vehicle_model,
                vehicle_year: driverData.vehicle_year,
                vehicle_color: driverData.vehicle_color,
                vehicle_plate: driverData.vehicle_plate,
                vehicle_type: driverData.vehicle_type,
                status: 'offline',
                is_available: false,
                rating: 5.0,
                total_rides: 0,
              });
            } catch (parseErr) {
              console.error('Failed to create driver from metadata:', parseErr);
            }
          }
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
      // نحفظ بيانات السائق في metadata — ستُستخدم عند أول تسجيل دخول
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            phone: input.phone,
            user_type: input.user_type,
            driver_data: input.driver ? JSON.stringify(input.driver) : null,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('فشل إنشاء الحساب');

      if (data.session) {
        // لا يوجد تأكيد إيميل — أنشئ الصفوف مباشرة
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
            license_number: input.driver.license_number,
            vehicle_make: input.driver.vehicle_make,
            vehicle_model: input.driver.vehicle_model,
            vehicle_year: input.driver.vehicle_year,
            vehicle_color: input.driver.vehicle_color,
            vehicle_plate: input.driver.vehicle_plate,
            vehicle_type: input.driver.vehicle_type,
            status: 'offline',
            is_available: false,
            rating: 5.0,
            total_rides: 0,
          }, { onConflict: 'user_id' });
        }

        toast.success('تم إنشاء الحساب بنجاح');
        return { error: null, needsEmailConfirmation: false };
      } else {
        // تأكيد إيميل مطلوب — لا نحاول إدراج شيء الآن
        // الـ trigger + signIn سيتولى الأمر بعد التفعيل
        toast.success('تم التسجيل! تحقق من بريدك الإلكتروني لتفعيل الحساب ثم سجّل الدخول.');
        return { error: null, needsEmailConfirmation: true };
      }
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
