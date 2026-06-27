import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/driver/dashboard', '/admin/dashboard', '/history', '/track'];
const adminPaths = ['/admin/dashboard'];
const driverPaths = ['/driver/dashboard'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // ✅ يجب إنشاء response أولاً ثم تمرير cookies عليه
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // نضع الـ cookies على الـ request والـ response معاً
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ✅ استخدم getUser بدل getSession — أكثر أماناً ويعمل مع cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // user_type من JWT metadata — لا يحتاج قاعدة بيانات
  let userType: string = user.user_metadata?.user_type ?? 'customer';

  // حماية مسارات المدير
  if (adminPaths.some((p) => pathname.startsWith(p)) && userType !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = userType === 'driver' ? '/driver/dashboard' : '/';
    return NextResponse.redirect(url);
  }

  // حماية مسارات السائق
  if (
    driverPaths.some((p) => pathname.startsWith(p)) &&
    userType !== 'driver' &&
    userType !== 'admin'
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    '/driver/dashboard/:path*',
    '/admin/dashboard/:path*',
    '/history/:path*',
    '/track/:path*',
  ],
};
