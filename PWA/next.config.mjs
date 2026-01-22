/** @type {import('next').NextConfig} */

// ✅ Safe fallback to prevent "Invalid rewrite found" crash
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  async rewrites() {
    // 🚨 Guard: Ensure destination is always valid
    if (!API_BASE_URL.startsWith("http")) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL must start with http:// or https://"
      );
    }

    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
