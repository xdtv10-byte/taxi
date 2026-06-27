'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Car, Users, MapPin, CheckCircle2, DollarSign, Star, LogOut, Loader2,
  LayoutDashboard, Settings, UserCheck, TrendingUp, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Ride, Driver, UserProfile, RideStatus } from '@/types';

const statusBadge: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  accepted: 'bg-info/15 text-info border-info/30',
  driver_arrived: 'bg-info/15 text-info border-info/30',
  in_progress: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

const driverStatusBadge: Record<string, string> = {
  online: 'bg-success/15 text-success',
  offline: 'bg-secondary text-muted-foreground',
  busy: 'bg-warning/15 text-warning',
};

export default function AdminDashboardPage() {
  const { t, lang } = useTranslation();
  const { profile, authLoading, signOut } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, drivers: 0, activeRides: 0, completedToday: 0, revenue: 0, avgRating: 0 });
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<(Driver & { name?: string })[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assignRideId, setAssignRideId] = useState('');
  const [assignDriverId, setAssignDriverId] = useState('');
  const [pendingRidesList, setPendingRidesList] = useState<Ride[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<(Driver & { name?: string })[]>([]);

  useEffect(() => {
    if (!authLoading && !profile) router.push('/login');
    if (!authLoading && profile && profile.user_type !== 'admin') {
      router.push(profile.user_type === 'driver' ? '/driver/dashboard' : '/');
    }
  }, [profile, authLoading, router]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: usersData }, { data: driversData }, { data: ridesData }, { data: settingsData }] =
      await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('drivers').select('*, users!inner(name)').eq('user_type', 'driver'),
        supabase.from('rides').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('admin_settings').select('*'),
      ]);

    const users = (usersData as UserProfile[]) ?? [];
    const drvs = (driversData as any[]) ?? [];
    const rds = (ridesData as Ride[]) ?? [];

    const drvWithNames = drvs.map((d) => ({ ...d, name: (d.users as any)?.name }));
    setDrivers(drvWithNames);
    setCustomers(users.filter((u) => u.user_type === 'customer'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = rds.filter(
      (r) => r.status === 'completed' && r.completed_at && new Date(r.completed_at) >= today
    );
    const revenue = rds.reduce((sum, r) => sum + (r.actual_fare ?? r.estimated_fare ?? 0), 0);
    const ratings = rds.filter((r) => r.customer_rating).map((r) => r.customer_rating!);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setStats({
      users: users.length,
      drivers: drvs.length,
      activeRides: rds.filter((r) => ['pending', 'accepted', 'driver_arrived', 'in_progress'].includes(r.status)).length,
      completedToday: completedToday.length,
      revenue,
      avgRating,
    });
    setRides(rds);
    setPendingRidesList(rds.filter((r) => r.status === 'pending'));
    setOnlineDrivers(drvWithNames.filter((d) => d.status === 'online'));

    const sMap: Record<string, string> = {};
    (settingsData ?? []).forEach((s: any) => (sMap[s.setting_key] = s.setting_value));
    setSettings(sMap);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.user_type === 'admin') fetchAll();
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleDriverActive = async (driverId: string, current: boolean) => {
    const { error } = await supabase.from('drivers').update({ is_available: !current }).eq('id', driverId);
    if (error) return toast.error(error.message);
    toast.success(t('success'));
    fetchAll();
  };

  const handleAssign = async () => {
    if (!assignRideId || !assignDriverId) return;
    const drv = drivers.find((d) => d.id === assignDriverId);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: drv?.user_id, status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', assignRideId)
      .eq('status', 'pending');
    if (error) return toast.error(error.message);
    await supabase.from('drivers').update({ status: 'busy' }).eq('id', assignDriverId);
    toast.success(lang === 'ar' ? 'تم تعيين السائق' : 'Driver assigned');
    setAssignRideId('');
    setAssignDriverId('');
    fetchAll();
  };

  const saveSettings = async () => {
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('admin_settings').update({ setting_value: value, updated_at: new Date().toISOString() }).eq('setting_key', key)
    );
    await Promise.all(updates);
    toast.success(t('settings_saved'));
  };

  const filteredRides = rides.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.pickup_address.toLowerCase().includes(q) ||
        r.dropoff_address.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredRides.length / pageSize);
  const pagedRides = filteredRides.slice((page - 1) * pageSize, page * pageSize);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: t('total_users'), value: stats.users, color: 'text-info' },
    { icon: Car, label: t('total_drivers'), value: stats.drivers, color: 'text-primary' },
    { icon: MapPin, label: t('active_rides'), value: stats.activeRides, color: 'text-warning', pulse: true },
    { icon: CheckCircle2, label: t('completed_today'), value: stats.completedToday, color: 'text-success' },
    { icon: DollarSign, label: t('total_revenue'), value: `${stats.revenue} ${t('sar')}`, color: 'text-success' },
    { icon: Star, label: t('avg_rating'), value: stats.avgRating.toFixed(1), color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('admin_dashboard')}</div>
              <div className="text-xs text-muted-foreground">{profile?.name}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              {t('overview')}
            </TabsTrigger>
            <TabsTrigger value="rides" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {t('rides')}
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-1.5">
              <Car className="h-4 w-4" />
              {t('drivers')}
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5">
              <Users className="h-4 w-4" />
              {t('customers')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              {t('settings')}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {statCards.map(({ icon: Icon, label, value, color, pulse }, i) => (
                <Card key={i} className="border-border p-4">
                  <div className="flex items-center justify-between">
                    <Icon className={cn('h-5 w-5', color)} />
                    {pulse && <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />}
                  </div>
                  <div className="mt-2 text-xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </Card>
              ))}
            </div>

            {/* Assign driver */}
            <Card className="border-border p-5">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <UserCheck className="h-5 w-5 text-primary" />
                {t('assign_driver')}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select value={assignRideId} onValueChange={setAssignRideId}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('select_ride')} /></SelectTrigger>
                  <SelectContent>
                    {pendingRidesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        #{r.id.slice(0, 8)} — {r.pickup_address.slice(0, 20)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('select_driver')} /></SelectTrigger>
                  <SelectContent>
                    {onlineDrivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} — {d.vehicle_make} {d.vehicle_model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!assignRideId || !assignDriverId} className="gap-2 gradient-primary text-white">
                  <UserCheck className="h-4 w-4" />
                  {t('assign')}
                </Button>
              </div>
              {pendingRidesList.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">{t('no_pending_rides')}</p>
              )}
            </Card>
          </TabsContent>

          {/* Rides */}
          <TabsContent value="rides">
            <Card className="border-border p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  placeholder={t('search')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="bg-secondary/50 sm:max-w-xs"
                />
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                  <SelectTrigger className="bg-secondary/50 sm:max-w-xs">
                    <SelectValue placeholder={t('filter_by_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    {['pending', 'accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled'].map((s) => (
                      <SelectItem key={s} value={s}>{t(s as any) || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ride_number')}</TableHead>
                      <TableHead>{t('from')}</TableHead>
                      <TableHead>{t('to')}</TableHead>
                      <TableHead>{t('type')}</TableHead>
                      <TableHead>{t('fare')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">{t('no_rides_yet')}</TableCell>
                      </TableRow>
                    ) : (
                      pagedRides.map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell className="font-mono text-xs">#{ride.id.slice(0, 8)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{ride.pickup_address}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{ride.dropoff_address}</TableCell>
                          <TableCell><Badge variant="outline">{t(ride.ride_type as any)}</Badge></TableCell>
                          <TableCell className="font-semibold">{ride.actual_fare ?? ride.estimated_fare} {t('sar')}</TableCell>
                          <TableCell>
                            <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', statusBadge[ride.status])}>
                              {t(ride.status as any) || ride.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(ride.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    {t('back')}
                  </Button>
                  <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    {lang === 'ar' ? 'التالي' : 'Next'}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Drivers */}
          <TabsContent value="drivers">
            <Card className="border-border p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('full_name')}</TableHead>
                      <TableHead>{t('vehicle_make')}</TableHead>
                      <TableHead>{t('vehicle_plate')}</TableHead>
                      <TableHead>{t('avg_rating')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('rides')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {lang === 'ar' ? 'لا يوجد سائقون' : 'No drivers'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      drivers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.name ?? '—'}</TableCell>
                          <TableCell>{d.vehicle_make} {d.vehicle_model}</TableCell>
                          <TableCell className="font-mono">{d.vehicle_plate}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                              {Number(d.rating).toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', driverStatusBadge[d.status])}>
                              {d.status === 'online' ? t('online') : d.status === 'busy' ? (lang === 'ar' ? 'مشغول' : 'Busy') : t('offline')}
                            </span>
                          </TableCell>
                          <TableCell>{d.total_rides}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={d.is_available ? 'outline' : 'default'}
                              onClick={() => toggleDriverActive(d.id, d.is_available)}
                            >
                              {d.is_available ? t('deactivate') : t('activate')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Customers */}
          <TabsContent value="customers">
            <Card className="border-border p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('full_name')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('phone')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {lang === 'ar' ? 'لا يوجد عملاء' : 'No customers'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell dir="ltr" className="text-start">{c.phone}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="max-w-xl border-border p-6">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Settings className="h-5 w-5 text-primary" />
                {t('settings')}
              </div>
              <div className="space-y-4">
                {[
                  { key: 'base_fare', label: t('base_fare') },
                  { key: 'per_km_rate', label: t('per_km_rate') },
                  { key: 'per_minute_rate', label: t('per_minute_rate') },
                  { key: 'max_search_radius', label: t('search_radius') },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</label>
                    <Input
                      value={settings[key] ?? ''}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('default_currency')}</label>
                  <Select
                    value={settings.currency ?? 'SAR'}
                    onValueChange={(v) => setSettings({ ...settings, currency: v })}
                  >
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveSettings} className="gap-2 gradient-primary text-white">
                  <Save className="h-4 w-4" />
                  {t('save_settings')}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
