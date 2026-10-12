import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // These read files next to their own code at runtime (PGlite its WASM build,
  // PDFKit its built-in font metrics), so they can't be bundled.
  serverExternalPackages: [
    "@electric-sql/pglite",
    "pglite-prisma-adapter",
    "pdfkit",
  ],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@electric-sql/pglite/dist/**/*"],
    "/api/certificates/*/pdf": ["./node_modules/pdfkit/js/data/**/*"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
