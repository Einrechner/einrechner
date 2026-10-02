import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The dev server listens on 0.0.0.0. Browsers that open 127.0.0.1 must still
  // be allowed to load the dev client, or inputs never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
}

export default nextConfig
