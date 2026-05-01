import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Facts from "@/components/otherPages/BungaFlat/Facts";
import LoanCalculator from "@/components/otherPages/BungaFlat/LoanCalculator";
import PageTitle from "@/components/otherPages/BungaFlat/PageTitle";
import Process from "@/components/otherPages/BungaFlat/Process";
import React from "react";

export const metadata = {
  title: "Bunga Flat || Proty - Real Estate React Nextjs Template",
  description: "Bunga flat page.",
};

export default function page() {
  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <PageTitle />
        <div className="main-content">
          <Facts />
          <Process />
          <LoanCalculator />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
