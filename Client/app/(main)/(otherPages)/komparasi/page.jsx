import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Compare from "@/components/compare/Compare";
import React, { Suspense } from "react";

export default function page() {
  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <Breadcumb pageName="Komparasi" />
        <div className="main-content">
          <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Memuat...</div>}>
            <Compare />
          </Suspense>
        </div>
        <Footer1 />
      </div>
    </>
  );
}