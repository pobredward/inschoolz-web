import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ESLint 오류를 무시하고 빌드 진행
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 오류를 무시하고 빌드 진행 (개발 단계에서만)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // 이미지 최적화 설정 (SEO용 og:image 등)
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
