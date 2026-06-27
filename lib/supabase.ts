import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ createBrowserClient بدل createClient
// يخزن الـ session في cookies (يقدر الـ middleware يقرأه)
// بالإضافة إلى localStorage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
