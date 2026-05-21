import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Properties3 from "@/components/properties/Properties3";
import React, { Suspense } from "react";

export const metadata = {
  title:
    "Daftar Properti || Diproperti - Properti",
  description: "Diproperti || Properti",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Daftar Properti" />
          <Suspense fallback={null}>
            <Properties3 defaultGrid />
          </Suspense>
        </div>
        <Footer1 />
      </div>
    </>
  );
}
