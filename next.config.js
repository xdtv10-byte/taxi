/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
};

module.exports = nextConfig;
