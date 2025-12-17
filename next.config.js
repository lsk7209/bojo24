/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Vercel 최적화
  poweredByHeader: false,
  compress: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  
  // 환경 변수 검증 (클라이언트에서 접근 가능하도록)
  // 주의: next.config.js의 env는 빌드 타임에만 적용됩니다.
  // Vercel에서는 NEXT_PUBLIC_ 접두사가 있는 환경 변수를 직접 사용해야 합니다.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://bojo24.kr',
    // Vercel에서 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 직접 설정해야 함
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  },
  
  // 실험적 기능
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@google/generative-ai'],
  },
  
  // 헤더 설정 (보안)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

