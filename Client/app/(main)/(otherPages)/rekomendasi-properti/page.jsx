import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import RekomendasiProperti from "@/components/otherPages/rekomendasi/RekomendasiProperti";
import React from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Rekomendasi Properti",
  description:
    "Dapatkan rekomendasi properti berdasarkan preferensi harga, lokasi, luas bangunan, luas tanah, dan fasilitas.",
  path: "/rekomendasi-properti",
});

export default function Page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Rekomendasi Properti" />
          <RekomendasiProperti />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
