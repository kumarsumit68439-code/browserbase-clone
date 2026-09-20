import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://browserbase-clone-open-source1.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms", "/docs"],
        disallow: [
          "/dashboard",
          "/api-keys",
          "/ai-keys",
          "/backend",
          "/backend-keys",
          "/database",
          "/sql-editor",
          "/storage",
          "/users",
          "/api/",
          "/auth/",
          "/oauth/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
