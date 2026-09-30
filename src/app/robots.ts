import type { MetadataRoute } from "next";
import { restaurang } from "@/data/restaurang";

/**
 * Sajten ska hittas av Google. Köksskärmen och API:t är inte till för
 * sökmotorer. Betalning och orderstatus stängs ute med noindex på själva
 * sidorna i stället, eftersom Google inte ser en noindex-tagg på en sida
 * som robots.txt hindrar den från att läsa.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/kok"] },
    sitemap: `${restaurang.url}/sitemap.xml`,
  };
}
