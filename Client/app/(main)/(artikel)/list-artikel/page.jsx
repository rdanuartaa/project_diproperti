import ArtikelList from "@/components/artikel/ArtikelList";
import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Artikel Properti",
  description:
    "Baca artikel terbaru Diproperti tentang jual beli properti, rekomendasi rumah, simulasi KPR, dan tips memilih properti.",
  path: "/list-artikel",
});
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Daftar Artikel" />
          <ArtikelList />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
