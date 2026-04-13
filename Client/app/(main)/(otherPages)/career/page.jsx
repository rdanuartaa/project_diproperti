import Cta from "@/components/common/Cta";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Benefits from "@/components/otherPages/career/Benefits";
import Jobs from "@/components/otherPages/career/Jobs";
import PageTitle from "@/components/otherPages/career/PageTitle";
import Reviews from "@/components/otherPages/career/Reviews";

import React from "react";

export default function page() {
  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <PageTitle />
        <div className="main-content">
          <Jobs />
          <Benefits />
          <Reviews />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
