import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // It is not recommended to use this in production.
    ignoreDuringBuilds: true,
  },
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    // remotePatterns: [new URL('https://avatars.githubusercontent.com/**')],
    remotePatterns: [
      {
        protocol: 'https', // or 'http'
        hostname: 'avatars.githubusercontent.com', // Replace with the hostname of your image source
        port: '', // Optional: specify if a non-standard port is used
        pathname: '/**', // Optional: specify a path pattern for images
      },
      // {
      //   protocol: 'https',
      //   hostname: 'another-domain.com', // Add more patterns for other remote sources
      // },
      // You can also use wildcards for hostname if needed (use with caution for security)
      // {
      //   protocol: 'https',
      //   hostname: '**', // Allows all https hostnames (use with extreme caution)
      // },
    ],
  },
};

export default nextConfig;
