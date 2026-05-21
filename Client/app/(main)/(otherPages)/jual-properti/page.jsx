import About from "@/components/otherPages/JualProperti/About";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import SubmitPropertyForm from "@/components/otherPages/JualProperti/SubmitPropertyForm";
import PageTitle from "@/components/otherPages/JualProperti/PageTitle";
import React from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Jual Properti",
  description:
    "Ajukan dan pasarkan properti Anda di Diproperti dengan proses mudah, rapi, dan terpantau oleh admin.",
  path: "/jual-properti",
});

export default function page() {
  return (
    <div id="wrapper" className="counter-scroll">
      <Header1 />
      <PageTitle />
      <div className="main-content">
        <About />
        <SubmitPropertyForm />
      </div>
      <Footer1 />
    </div>
  );
}
