import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

function getApiRewriteDestination() {
  if (!configuredApiUrl) {
    return "http://localhost:3001/:path*";
  }

  try {
    const apiUrl = new URL(configuredApiUrl);
    const apiPath = apiUrl.pathname.replace(/\/+$/, "");

    return `${apiUrl.origin}${apiPath === "/" ? "" : apiPath}/:path*`;
  } catch {
    const normalizedApiTarget = configuredApiUrl.replace(/\/+$/, "");
    return `${normalizedApiTarget}/:path*`;
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: getApiRewriteDestination(),
      },
    ];
  },
};

export default nextConfig;
