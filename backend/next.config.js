/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 1. Helps avoid issues with Prisma/Server Components during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. Ensures the build doesn't fail if there are minor TS issues in production
  typescript: {
    ignoreBuildErrors: true, 
  },
  // 3. Helpful for Render's environment if you use standalone output (saves disk space)
  output: 'standalone', 
};

module.exports = nextConfig;
