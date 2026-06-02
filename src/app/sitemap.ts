import { MetadataRoute } from "next";
import { getStaticSitemapRoutes } from "@lib/sitemapRoutes";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
    return getStaticSitemapRoutes();
}
