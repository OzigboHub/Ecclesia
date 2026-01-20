import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set Turbopack root to fix workspace detection
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
