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
}

module.exports = nextConfig
