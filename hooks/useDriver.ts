'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import type { Driver, Ride, RideStatus, UserProfile } from '@/types';
import { toast } from 'sonner';

export function useDriver() {
  const { user, profile } = useApp();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<UserProfile | null>(null);
  const [todayStats, setTodayStats] = useState({ rides: 0, earnings: 0, rating: 5 });
  const [loading, setLoading] = useState(false);

  const fetchDriver = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setDriver(data as Driver | null);
  }, [user]);

  const fetchPendingRides = useCallback(async () => {
    if (!driver) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    setPendingRides((data as Ride[]) ?? []);
  }, [driver]);

  const fetchActiveRide = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['accepted', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const ride = data as Ride | null;
    setActiveRide(ride);

    // جلب بيانات العميل
    if (ride?.customer_id) {
      const { data: cu } = await supabase
        .from('users')
        .select('*')
        .eq('id', ride.customer_id)
        .maybeSingle();
      setActiveCustomer(cu as UserProfile | null);
    } else {
      setActiveCustomer(null);
    }
  }, [user]);

  const fetchTodayStats = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('rides')
      .select('actual_fare, estimated_fare')
      .eq('driver_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', start.toISOString());
    const rides = data ?? [];
    const earnings = rides.reduce(
      (sum, r) => sum + (r.actual_fare ?? r.estimated_fare ?? 0),
      0
    );
    setTodayStats({ rides: rides.length, earnings, rating: driver?.rating ?? 5 });
  }, [user, driver]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  useEffect(() => {
    fetchPendingRides();
    fetchActiveRide();
    fetchTodayStats();
    const interval = setInterval(() => {
      fetchPendingRides();
      fetchActiveRide();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchPendingRides, fetchActiveRide, fetchTodayStats]);

  const setStatus = async (status: 'online' | 'offline' | 'busy') => {
    if (!driver) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status, is_available: status === 'online' })
        .eq('id', driver.id);
      if (error) throw error;
      setDriver({ ...driver, status, is_available: status === 'online' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!user || !driver) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .update({ driver_id: user.id, status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', rideId)
        .eq('status', 'pending')
        .select('*')
        .single();
      if (error) throw error;
      await supabase
        .from('drivers')
        .update({ status: 'busy' })
        .eq('id', driver.id);
      const ride = data as Ride;
      setActiveRide(ride);
      setPendingRides((prev) => prev.filter((r) => r.id !== rideId));

      // جلب بيانات العميل
      if (ride.customer_id) {
        const { data: cu } = await supabase
          .from('users')
          .select('*')
          .eq('id', ride.customer_id)
          .maybeSingle();
        setActiveCustomer(cu as UserProfile | null);
      }

      toast.success('تم قبول الرحلة');
    } catch (e: any) {
      toast.error(e.message || 'فشل قبول الرحلة');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (rideId: string, status: RideStatus) => {
    setLoading(true);
    try {
      const updates: any = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        if (activeRide?.estimated_fare) updates.actual_fare = activeRide.estimated_fare;
      }
      const { error } = await supabase.from('rides').update(updates).eq('id', rideId);
      if (error) throw error;
      if (status === 'completed' && driver) {
        await supabase
          .from('drivers')
          .update({ status: 'online', total_rides: (driver.total_rides ?? 0) + 1 })
          .eq('id', driver.id);
        setActiveRide(null);
        setActiveCustomer(null);
      } else {
        setActiveRide((prev) => (prev ? { ...prev, status } : null));
      }
      toast.success('تم تحديث الحالة');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!driver) return;
    await supabase
      .from('drivers')
      .update({ current_lat: lat, current_lng: lng })
      .eq('id', driver.id);
    if (activeRide) {
      await supabase.from('ride_tracking').insert({
        ride_id: activeRide.id,
        driver_lat: lat,
        driver_lng: lng,
      });
    }
  };

  return {
    driver,
    pendingRides,
    activeRide,
    activeCustomer,
    todayStats,
    loading,
    setStatus,
    acceptRide,
    updateRideStatus,
    updateLocation,
    fetchDriver,
    fetchPendingRides,
    fetchActiveRide,
  };
}
