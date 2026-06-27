'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type Lang = 'ar' | 'en';
type Currency = 'SAR' | 'USD';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: 'customer' | 'driver' | 'admin';
  profile_image: string | null;
  is_active: boolean;
};

type AppContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'rtl' | 'ltr';
  currency: Currency;
  setCurrency: (c: Currency) => void;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within Providers');
  return ctx;
}

// Fetch profile with retry — in case row doesn't exist yet (trigger delay or RLS)
async function fetchProfileWithRetry(
  userId: string,
  retries = 3,
  delayMs = 800
): Promise<UserProfile | null> {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) return data as UserProfile;

    // If not found yet, wait and retry
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [currency, setCurrencyState] = useState<Currency>('SAR');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Lang | null;
    if (savedLang) setLangState(savedLang);
    const savedCur = localStorage.getItem('currency') as Currency | null;
    if (savedCur) setCurrencyState(savedCur);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const s = data.session;
      setSession(s);
      if (s?.user) {
        const p = await fetchProfileWithRetry(s.user.id);
        if (mounted) {
          setProfile(p);
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    });

    // Auth state listener
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (!newSession) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        setAuthLoading(true);
        // Use retry in case the trigger hasn't created the row yet
        const p = await fetchProfileWithRetry(newSession.user.id, 5, 600);
        if (mounted) {
          setProfile(p);
          setAuthLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setLang = (l: Lang) => setLangState(l);
  const setCurrency = (c: Currency) => setCurrencyState(c);

  const refreshProfile = async () => {
    if (!session) return;
    const p = await fetchProfileWithRetry(session.user.id);
    setProfile(p);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        dir,
        currency,
        setCurrency,
        session,
        user: session?.user ?? null,
        profile,
        authLoading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
