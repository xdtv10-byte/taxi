'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import type { Ride, RideType, PaymentMethod, GeoPoint } from '@/types';
import { toast } from 'sonner';

type BookRideInput = {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  ride_type: RideType;
  payment_method: PaymentMethod;
  estimated_fare: number;
  distance_km: number;
  duration_minutes: number;
};

export function useRide() {
  const { user } = useApp();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCurrentRide = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('customer_id', user.id)
      .in('status', ['pending', 'accepted', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrentRide(data as Ride | null);
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('customer_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false });
    setRideHistory((data as Ride[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchCurrentRide();
    fetchHistory();
  }, [fetchCurrentRide, fetchHistory]);

  const bookRide = async (input: BookRideInput): Promise<Ride | null> => {
    if (!user) {
      toast.error('سجّل الدخول لحجز رحلة');
      return null;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .insert({
          customer_id: user.id,
          pickup_address: input.pickup.address,
          pickup_lat: input.pickup.lat,
          pickup_lng: input.pickup.lng,
          dropoff_address: input.dropoff.address,
          dropoff_lat: input.dropoff.lat,
          dropoff_lng: input.dropoff.lng,
          ride_type: input.ride_type,
          payment_method: input.payment_method,
          estimated_fare: input.estimated_fare,
          distance_km: input.distance_km,
          duration_minutes: input.duration_minutes,
          status: 'pending',
        })
        .select('*')
        .single();
      if (error) throw error;
      toast.success('تم حجز رحلتك بنجاح');
      setCurrentRide(data as Ride);
      return data as Ride;
    } catch (e: any) {
      toast.error(e.message || 'فشل حجز الرحلة');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);
      if (error) throw error;
      toast.success('تم إلغاء الرحلة');
      setCurrentRide(null);
    } catch (e: any) {
      toast.error(e.message || 'فشل الإلغاء');
    } finally {
      setLoading(false);
    }
  };

  const rateRide = async (rideId: string, rating: number, feedback: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ customer_rating: rating, customer_feedback: feedback })
        .eq('id', rideId);
      if (error) throw error;
      toast.success('شكراً لتقييمك');
    } catch (e: any) {
      toast.error(e.message || 'فشل التقييم');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentRide,
    rideHistory,
    loading,
    bookRide,
    cancelRide,
    rateRide,
    fetchCurrentRide,
    fetchHistory,
  };
}
