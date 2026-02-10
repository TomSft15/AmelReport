import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // Augmenté de 1MB à 5MB pour les articles longs
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Empêche l'affichage du site dans une iframe (protection clickjacking)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Force le navigateur à respecter le MIME type déclaré
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Limite les infos de referrer envoyées
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Désactive l'accès aux API sensibles
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Active la protection XSS des navigateurs anciens
          },
        ],
      },
    ];
  },
};

export default nextConfig;
