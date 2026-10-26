import type { NextConfig } from "next";

// The Python backend (`uv run voice-web`) owns all inference. The browser only
// ever talks to this origin; these rewrites forward API traffic to it, which
// keeps cookies/CORS out of the picture and lets the backend stay bound to
// 127.0.0.1.
const BACKEND = process.env.SWARALOOM_BACKEND ?? "http://127.0.0.1:8823";

const nextConfig: NextConfig = {
  experimental: {
    // A cold Hindi generation can take well over the 30 s proxy default.
    proxyTimeout: 10 * 60 * 1000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
      { source: "/v1/:path*", destination: `${BACKEND}/v1/:path*` },
    ];
  },
};

export default nextConfig;
