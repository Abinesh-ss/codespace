/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Required for PWA image handling and performance
  images: {
    unoptimized: true, 
  },

  // Fixed Rewrites: This bridges Port 3000 to Port 3001
  async rewrites() {
    return [
      {
        // When the frontend calls "/api/something"
        source: '/api/:path*',
        // It maps to "http://localhost:3001/api/something"
        // We MUST include the /api/ prefix here to match your backend routes
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
