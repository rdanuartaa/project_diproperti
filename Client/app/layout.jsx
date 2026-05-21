import "../styles/main.scss";
import "odometer/themes/odometer-theme-default.css";
import "photoswipe/style.css";
import "rc-slider/assets/index.css";
import AppClientShell from "./AppClientShell";
import { absoluteUrl, mainNavigation, siteDescription, siteName, siteUrl } from "./seo";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Diproperti - Platform Properti Jember",
    template: "%s | Diproperti",
  },
  description: siteDescription,
  keywords: [
    "properti Jember",
    "jual beli rumah",
    "jual properti",
    "rekomendasi properti",
    "komparasi properti",
    "simulasi KPR",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Diproperti - Platform Properti Jember",
    description: siteDescription,
    url: siteUrl,
    siteName,
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/diproperti/logofirst.svg",
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diproperti - Platform Properti Jember",
    description: siteDescription,
    images: ["/images/diproperti/logofirst.svg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      areaServed: "Jember, Jawa Timur",
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/list-properti")}?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Menu Utama Diproperti",
      itemListElement: mainNavigation.map((item, index) => ({
        "@type": "SiteNavigationElement",
        position: index + 1,
        name: item.name,
        description: item.description,
        url: absoluteUrl(item.url),
      })),
    },
  ];

  return (
    <html lang="id">
      <body className="popup-loader">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
