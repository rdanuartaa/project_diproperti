import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";

import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import Properties9 from "@/components/properties/Properties9";
import React from "react";

export const metadata = {
  title:
    "Property List Sidebar Right || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <Breadcumb pageName="Proper Filter Popup Right" />
        <div className="main-content">
          <Properties9 />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
