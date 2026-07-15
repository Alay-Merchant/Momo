import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const csp = `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
    const headers = [
      { key: "Content-Security-Policy", value: csp }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];
    if (!isDev) headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" });
    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
