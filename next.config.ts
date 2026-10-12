import type { NextConfig } from "next";

const graphqlDestination =
  process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/graphql";
const storageDestination = graphqlDestination.replace(/\/graphql$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
      {
        source: "/graphql",
        destination: graphqlDestination,
      },
      {
        // Favicons must be served from the tenant app origin. Chromium may
        // ignore a cross-origin favicon even when the image itself is valid.
        source: "/tenant-assets/:path*",
        destination: `${storageDestination}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
