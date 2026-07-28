import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polished-echidna-803.convex.cloud",
      },
    ],
  },
};

export default config;
