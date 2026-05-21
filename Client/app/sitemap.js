import { absoluteUrl, mainNavigation } from "./seo";

export default function sitemap() {
  const now = new Date();

  return mainNavigation.map((item) => ({
    url: absoluteUrl(item.url),
    lastModified: now,
    changeFrequency: item.url === "/" ? "daily" : "weekly",
    priority: item.url === "/" ? 1 : 0.8,
  }));
}
