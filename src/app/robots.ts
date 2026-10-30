import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/terms", "/privacy"],
        disallow: [
          "/dashboard",
          "/tasks",
          "/virtual-home",
          "/money",
          "/rankings",
          "/neighborhood",
          "/achievements",
          "/profile",
          "/settings",
          "/classes",
          "/workspace",
          "/chat",
          "/api/",
          "/green",
          "/rewards",
          "/verify",
        ],
      },
    ],
    sitemap: "https://classcrib.com/sitemap.xml",
  };
}
