import path from "node:path";

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverExternalPackages: [
      "bullmq",
      "@bull-board/api",
      "@bull-board/ui",
      "@bull-board/hono",
      "@hono/node-server",
    ],
  },
};

export default nextConfig;
