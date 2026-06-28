'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySelector } from './CurrencySelector';
import { Button } from '@/components/ui/button';
import { Car, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { t, lang } = useTranslation();
  const { profile, signOut } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: '#services', label: t('services') },
    { href: '#about', label: t('about') },
    { href: '#contact', label: t('contact') },
    { href: '/driver-portal', label: t('driver_portal') },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shrink-0" style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
            <Car className="h-[18px] w-[18px] text-black" strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" style={{border:'2px solid hsl(240 10% 3.9%)'}}/>
          </div>
          <span className="text-[1.2rem] font-black tracking-tight" style={{letterSpacing:'-0.045em'}}>
            TAXI<span className="text-gradient font-light" style={{letterSpacing:'-0.02em'}}>hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <CurrencySelector />
          </div>

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">{profile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      profile.user_type === 'admin'
                        ? '/admin/dashboard'
                        : profile.user_type === 'driver'
                        ? '/driver/dashboard'
                        : '/history'
                    )
                  }
                >
                  <User className="h-4 w-4" />
                  {lang === 'ar' ? 'لوحتي' : 'My Dashboard'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button size="sm" asChild className="gradient-primary text-white hover:opacity-90">
                <Link href="/register">{t('register')}</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 glass-strong md:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-border/40 pt-3">
              <LanguageSwitcher />
              <CurrencySelector />
            </div>
            {!profile && (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button size="sm" asChild className="flex-1 gradient-primary text-white">
                  <Link href="/register">{t('register')}</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
