import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // These read files next to their own code at runtime (PGlite its WASM build,
  // PDFKit its built-in font metrics), so they can't be bundled. Next's file
  // tracing already ships those files with each function.
  serverExternalPackages: [
    "@electric-sql/pglite",
    "pglite-prisma-adapter",
    "pdfkit",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
