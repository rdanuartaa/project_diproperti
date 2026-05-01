import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Details1 from "@/components/propertyDetails/Details1";
import RelatedProperties from "@/components/propertyDetails/RelatedProperties";
import Slider1 from "@/components/propertyDetails/sliders/Slider1";
import React from "react";

// 🔹 Dynamic Metadata SEO (Sama seperti detail artikel)
export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Format judul: "rumah-mewah-jakarta" -> "Rumah Mewah Jakarta"
  const formattedTitle = slug
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    title: `${formattedTitle} | Proty Real Estate`,
    description: `Detail Properti ${formattedTitle} - Proty Real Estate React Nextjs Template`,
    openGraph: {
      title: `${formattedTitle} | Proty Real Estate`,
      description: `Temukan detail lengkap properti ${formattedTitle}.`,
      type: "website",
    },
  };
}

// 🔹 Server Component (Tanpa "use client")
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