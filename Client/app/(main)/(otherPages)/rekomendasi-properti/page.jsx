import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import RekomendasiProperti from "@/components/otherPages/rekomendasi/RekomendasiProperti";
import React from "react";

export const metadata = {
  title: "Rekomendasi Properti || Diproperti - Properti",
  description: "Diproperti || Properti",
};

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
