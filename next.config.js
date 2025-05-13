/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yrvqoayeqsnutjnugyid.supabase.co',
        pathname: '/storage/v1/object/public/images/**'
      },
    ]
  },
  // 自定義 headers 來修正 Permissions-Policy 警告
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            // 移除不被識別的 browsing-topics 功能
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig
