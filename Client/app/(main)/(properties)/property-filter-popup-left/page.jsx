import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";

import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import Properties8 from "@/components/properties/Properties8";
import React from "react";

export const metadata = {
  title:
    "Property List Full width || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <Breadcumb pageName="Property Filter Popup Left" />
        <div className="main-content">
          <Properties8 />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
