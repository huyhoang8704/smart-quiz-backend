import type { NextConfig } from "next";
// const JavaScriptObfuscator = require('webpack-obfuscator');
import JavaScriptObfuscator from 'webpack-obfuscator';

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
  // 1. TẮT SOURCE MAPS (Nên làm nếu muốn bảo mật tối đa)
  // Nếu bật, người dùng vẫn có thể xem mã nguồn gốc trong DevTools.
  productionBrowserSourceMaps: false,
  compiler: {
    // SWC sẽ chỉ áp dụng quy tắc này trong môi trường production (next build)
    removeConsole: {
      // Giữ lại console.error và console.warn (thường quan trọng cho monitoring)
      // Các lệnh khác như console.log, console.info, console.debug sẽ bị xóa.
      exclude: ['error', 'warn'],
    },
  },

  /* config options here */
  webpack(config, { isServer, dev }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.resolve.alias.canvas = false;


    // 2. TÍCH HỢP OBFUSCATOR
    // Chỉ áp dụng Obfuscator trong môi trường Production (!dev)
    // và chỉ cho mã Client-side (!isServer)
    if (!isServer && !dev) {
      config.plugins.push(
        new JavaScriptObfuscator(
          {
            // --- TÙY CHỌN OBFUSCATOR TĂNG CƯỜNG BẢO MẬT ---
            compact: true,
            controlFlowFlattening: true, // Làm rối luồng điều khiển (mạnh mẽ)
            deadCodeInjection: true,     // Chèn mã chết giả
            stringArray: true,           // Mã hóa chuỗi
            stringArrayThreshold: 1,     // Áp dụng cho 100% chuỗi
            // Bạn có thể tham khảo thêm các tùy chọn khác trên GitHub của javascript-obfuscator
          },
          // Những file cần loại trừ (Rất quan trọng để tránh làm hỏng build)
          [
            // Loại trừ các file manifest quan trọng của Next.js
            '_buildManifest.js',
            '_ssgManifest.js',
            // Các file khác của Next.js mà bạn không muốn đụng vào
            'framework-*.js', // Ví dụ
          ]
        )
      );
    }

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
