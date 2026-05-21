import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Properties3 from "@/components/properties/Properties3";
import React, { Suspense } from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Daftar Properti",
  description:
    "Jelajahi daftar properti di Diproperti, mulai dari rumah, ruko, kos, tanah, villa, hingga properti komersial.",
  path: "/list-properti",
});
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
