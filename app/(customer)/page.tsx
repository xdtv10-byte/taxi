'use client';

import { Header } from '@/components/shared/Header';
import { BookingForm } from '@/components/booking/BookingForm';
import { useTranslation } from '@/hooks/useTranslation';
import { Car, Sparkles, Crown, Users, MapPin, Star, Building2, Phone, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';

export default function HomePage() {
  const { t, lang } = useTranslation();

  const services = [
    { type: 'economy', icon: Car, name: t('economy'), desc: t('economy_desc'), price: 15 },
    { type: 'comfort', icon: Sparkles, name: t('comfort'), desc: t('comfort_desc'), price: 23 },
    { type: 'premium', icon: Crown, name: t('premium'), desc: t('premium_desc'), price: 30 },
  ];

  const stats = [
    { icon: Users, value: '12,500+', label: t('stat_drivers') },
    { icon: Car, value: '850K+', label: t('stat_rides') },
    { icon: Star, value: '4.9', label: t('stat_rating') },
    { icon: Building2, value: '24', label: t('stat_cities') },
  ];

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('message_sent'));
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {lang === 'ar' ? 'متاح الآن في مدينتك' : 'Available in your city now'}
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {t('hero_title')}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground">{t('hero_subtitle')}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span>4.9 {lang === 'ar' ? 'تقييم' : 'rating'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>12,500+ {lang === 'ar' ? 'سائق' : 'drivers'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>24 {lang === 'ar' ? 'مدينة' : 'cities'}</span>
                </div>
              </div>
            </div>
            <div className="animate-fade-in">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-border/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('services_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('services_subtitle')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map(({ type, icon: Icon, name, desc, price }) => (
              <div
                key={type}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">{t('starting_from')}</span>
                    <span className="text-2xl font-bold text-gradient">{price} {t('sar')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('about_title')}</h2>
            <p className="mt-4 text-muted-foreground">{t('about_desc')}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary/40"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gradient">{value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('contact_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('contact_subtitle')}</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="space-y-4">
              {[
                { icon: Phone, label: lang === 'ar' ? 'الهاتف' : 'Phone', value: '+966 11 234 5678' },
                { icon: Mail, label: lang === 'ar' ? 'البريد' : 'Email', value: 'support@taxihub.app' },
                { icon: MapPin, label: lang === 'ar' ? 'العنوان' : 'Address', value: lang === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia' },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleContact} className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('name')}</label>
                <Input
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('email')}</label>
                <Input
                  required
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('message')}</label>
                <Textarea
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="bg-secondary/50"
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full gap-2 gradient-primary text-white hover:opacity-90">
                <Send className="h-4 w-4" />
                {t('send_message')}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-secondary/20 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                Taxi<span className="text-gradient">Hub</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#services" className="hover:text-foreground">{t('services')}</a>
              <a href="#about" className="hover:text-foreground">{t('about')}</a>
              <a href="#contact" className="hover:text-foreground">{t('contact')}</a>
              <a href="/driver-portal" className="hover:text-foreground">{t('driver_portal')}</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaxiHub — {t('rights')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
