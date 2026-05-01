import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Properties3 from "@/components/properties/Properties3";
import React from "react";

export const metadata = {
  title:
    "Property List Left Sidebar || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Property Listing" />
          <Properties3 defaultGrid />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
