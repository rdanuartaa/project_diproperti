import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Brands from "@/components/projects/Brands";
import Details from "@/components/projects/Details";
import Featured from "@/components/projects/Featured";
import Features from "@/components/projects/Features";
import FloorLayout from "@/components/projects/FloorLayout";
import Gallery from "@/components/projects/Gallery";
import { allprojects } from "@/data/projects";

import React from "react";

export default async function page({ params }) {
  const { id } = await params;

  const project =
    allprojects.filter((elm) => elm.id == id)[0] || allprojects[0];

  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <Breadcumb pageName="Project Details" />
        <div className="main-content">
          <Details project={project} />
          <FloorLayout />
          <Featured />
          <Features />
          <Gallery />
          <Brands />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
