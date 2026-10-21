// Where the Express API runs. The browser never calls it directly:
// requests to /api/* on this site are forwarded to it (see rewrites below).
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Keep the dev-only Next.js button away from the sidebar's account menu.
  devIndicators: { position: "bottom-right" },
  turbopack: {
    // This app lives in client/ inside a bigger repo; keep Turbopack's root here.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
