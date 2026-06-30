/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  output: "standalone",

  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },

  // --- ADDED CORS HEADERS CONFIGURATION BELOW ---
  async headers() {
    return [
      {
        // This applies the CORS rules to all your API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Allows your specific local frontend to access this backend
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3001" }, 
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { 
            key: "Access-Control-Allow-Headers", 
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" 
          },
        ]
      }
    ]
  }
};

module.exports = nextConfig;
