import DetailArtikel from "@/components/artikel/DetailArtikel";
import RelatedArtikel from "@/components/artikel/RelatedArtikel";
import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";

// 🔹 Dynamic Metadata SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} | Diproperti || Real Estate`,
    description: "Detail Artikel Diproperti || Real Estate",
  };
}

// 🔹 Server Component
export default async function page({ params }) {
  const { slug } = await params;

  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Detail Artikel" />
          <DetailArtikel slug={slug} />
          <RelatedArtikel/>
        </div>
        <Footer1 />
      </div>
    </>
  );
}
