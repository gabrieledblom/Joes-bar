import type { MetadataRoute } from "next";
import { restaurang } from "@/data/restaurang";

/** Bara sidorna som gäster ska hitta. Kassa, betalning och orderstatus hör inte hit. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/meny", "/villkor", "/integritetspolicy"].map((sokvag) => ({
    url: `${restaurang.url}${sokvag}`,
  }));
}
