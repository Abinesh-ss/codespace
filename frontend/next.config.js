/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure production builds don't use 'eval' source maps
  productionBrowserSourceMaps: false,
  
  // If you are using specialized experimental features, 
  // ensure they aren't conflicting with the Edge runtime
  experimental: {
    // serverComponentsExternalPackages: ['...'] 
  },
};

module.exports = nextConfig;
