import DetailArtikel from "@/components/artikel/DetailArtikel";
import RelatedArtikel from "@/components/artikel/RelatedArtikel";
import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";
import { absoluteUrl } from "@/app/seo";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const formattedTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const path = `/artikel/${slug}`;

  return {
    title: `${formattedTitle} - Artikel Properti`,
    description: `Baca artikel ${formattedTitle} di Diproperti untuk mendapatkan informasi dan panduan seputar properti.`,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${formattedTitle} - Artikel Properti | Diproperti`,
      description: `Informasi properti terbaru dari Diproperti: ${formattedTitle}.`,
      url: absoluteUrl(path),
      type: "article",
    },
  };
}

export default async function page({ params }) {
  const { slug } = await params;

  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Detail Artikel" />
          <DetailArtikel slug={slug} />
          <RelatedArtikel currentSlug={slug} />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
