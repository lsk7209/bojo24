import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://bojo24.kr";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/private/"], // API 경로는 수집 제외
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
