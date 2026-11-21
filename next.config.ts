import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal app: every page is per-user and dynamic, so Cache Components is off for now.
  typedRoutes: true,
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
