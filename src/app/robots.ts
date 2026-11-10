import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
