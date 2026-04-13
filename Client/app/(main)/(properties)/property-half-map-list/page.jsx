import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import Properties5 from "@/components/properties/Properties5";
import Properties6 from "@/components/properties/Properties6";
import React from "react";

export const metadata = {
  title: "Property Half Map Grid || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />

        <div className="main-content">
          <Properties6 />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
