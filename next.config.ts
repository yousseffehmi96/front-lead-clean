import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genere un serveur autonome (.next/standalone) utilise par l'image Docker
  output: "standalone",
};

export default nextConfig;
