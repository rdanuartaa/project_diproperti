import Cta from "@/components/common/Cta";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import PageTitle from "@/components/projects/PageTitle";
import Project1 from "@/components/projects/Project1";

import React from "react";

export default function page() {
  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <PageTitle />
        <div className="main-content">
          <Project1 />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
