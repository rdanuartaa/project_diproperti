import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Details1 from "@/components/propertyDetails/Details1";
import RelatedProperties from "@/components/propertyDetails/RelatedProperties";
import Slider1 from "@/components/propertyDetails/sliders/Slider1";
import React from "react";
import { absoluteUrl } from "@/app/seo";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const formattedTitle = slug
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const path = `/properti/${slug}`;

  return {
    title: `${formattedTitle} - Detail Properti`,
    description: `Lihat detail lengkap properti ${formattedTitle}, termasuk lokasi, harga, luas, fasilitas, dan informasi penting lainnya di Diproperti.`,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${formattedTitle} - Detail Properti | Diproperti`,
      description: `Temukan detail lengkap properti ${formattedTitle} di Diproperti.`,
      url: absoluteUrl(path),
      type: "website",
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
          <Breadcumb pageName="Detail Properti" />
          <Slider1 slug={slug} />
          <Details1 slug={slug} />
          <RelatedProperties slug={slug} />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
