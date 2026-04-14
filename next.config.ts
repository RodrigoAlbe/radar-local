import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.trycloudflare.com"],
  ...(distDir ? { distDir } : {}),
};

export default nextConfig;
