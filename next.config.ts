import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  outputFileTracingIncludes: {
    "/*": ["./supabase-ca.crt"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
