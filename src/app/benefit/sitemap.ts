import { MetadataRoute } from "next";
import { getBenefitSitemapRoutes } from "@lib/sitemapRoutes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return getBenefitSitemapRoutes();
}
