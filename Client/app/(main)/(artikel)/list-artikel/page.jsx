import ArtikelList from "@/components/artikel/ArtikelList";
import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";

export const metadata = {
  title: "Daftar Artikel || Diproperti - Properti",
  description: "Diproperti || Properti",
};
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
