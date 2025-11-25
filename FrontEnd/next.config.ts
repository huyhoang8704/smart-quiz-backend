import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // It is not recommended to use this in production.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.resolve.alias.canvas = false;
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
      // https://qldapm.sgp1.digitaloceanspaces.com/materials/68cd25ee7fb350d4799d9df9/1764032279067-v14025g50000cmhfsv7og65ul8pr6al0.MP4
      {
        protocol: 'https', // or 'http'
        hostname: 'qldapm.sgp1.digitaloceanspaces.com', // Replace with the hostname of your image source
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
