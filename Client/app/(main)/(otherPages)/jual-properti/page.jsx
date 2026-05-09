import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/common/Breadcumb";
import SubmitPropertyForm from "@/components/otherPages/JualProperti/SubmitPropertyForm";
import PageTitle from "@/components/otherPages/JualProperti/PageTitle";
import React from "react";

export const metadata = {
  title: "Jual Properti || Diproperti - Real Estate",
  description: "Pengajuan jual properti.",
};

export default function page() {
  return (
    <div id="wrapper" className="counter-scroll">
      <Header1 />
      <PageTitle />
      <Breadcumb pageName="Jual Properti" />
      <div className="main-content">
        <SubmitPropertyForm />
      </div>
      <Footer1 />
    </div>
  );
}
