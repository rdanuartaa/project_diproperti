import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";

import Details5 from "@/components/propertyDetails/Details5";
import RelatedProperties from "@/components/propertyDetails/RelatedProperties";

import Slider5 from "@/components/propertyDetails/sliders/Slider5";

import React from "react";
import { allProperties } from "@/data/properties";

export const metadata = {
  title: "Property Details 05 || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default async function page({ params }) {
  const { id } = await params;

  const property =
    allProperties.filter((elm) => elm.id == id)[0] || allProperties[0];

  return (
    <>
      <div id="wrapper">
        <Header1 />
        <Breadcumb pageName="Property Details 05" />
        <div className="main-content">
          <Slider5 />
          <Details5 property={property} />
          <RelatedProperties />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
