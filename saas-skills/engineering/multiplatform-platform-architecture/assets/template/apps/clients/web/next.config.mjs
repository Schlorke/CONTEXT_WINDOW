import path from "node:path";

const workspaceRoot = path.join(import.meta.dirname, "..", "..", "..");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them for the browser and the server.
  transpilePackages: ["@acme/frontend", "@acme/ui", "@acme/design-tokens"],
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
};

export default nextConfig;
