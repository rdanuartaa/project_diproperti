/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google & Gravatar (existing)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/**',
      },
      
      // ✅ TAMBAHKAN INI - Cloudflare R2 Storage Endpoint
      {
        protocol: 'https',
        hostname: 'pub-a0eea8f875e1416b9ea4a5c4a1cea45e.r2.dev',
        pathname: '/**',
      },
      // Fallback storage endpoint
      {
        protocol: 'https',
        hostname: 'fb3a2dc81205b1b0db304f38a255110d.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      // Laravel Local Storage (fallback)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;