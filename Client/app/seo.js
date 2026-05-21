export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://diproperti.com";

export const siteName = "Diproperti";

export const siteDescription =
  "Diproperti membantu Anda mencari, membandingkan, merekomendasikan, dan memasarkan properti di Jember dan sekitarnya.";

export const mainNavigation = [
  {
    name: "Beranda",
    url: "/",
    description: "Temukan properti pilihan dan fitur unggulan Diproperti.",
  },
  {
    name: "Properti",
    url: "/list-properti",
    description: "Cari rumah, ruko, kos, tanah, villa, dan properti lainnya.",
  },
  {
    name: "Rekomendasi Properti",
    url: "/rekomendasi-properti",
    description: "Dapatkan rekomendasi properti berdasarkan harga, lokasi, luas, dan fasilitas.",
  },
  {
    name: "Komparasi Properti",
    url: "/komparasi",
    description: "Bandingkan beberapa properti agar keputusan pembelian lebih mudah.",
  },
  {
    name: "Simulasi KPR",
    url: "/simulasi-kpr",
    description: "Hitung estimasi cicilan KPR berdasarkan harga, uang muka, bunga, dan tenor.",
  },
  {
    name: "Artikel",
    url: "/list-artikel",
    description: "Baca informasi dan panduan terbaru seputar properti.",
  },
  {
    name: "Jual Properti",
    url: "/jual-properti",
    description: "Pasarkan properti Anda melalui Diproperti dengan proses terpantau admin.",
  },
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function createPageMetadata({ title, description, path = "/", image = "/images/diproperti/logofirst.svg" }) {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: image,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
