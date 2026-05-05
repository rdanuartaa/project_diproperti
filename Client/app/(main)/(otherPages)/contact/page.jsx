import About from "@/components/contact/About";
import Breadcumb from "@/components/common/Breadcumb";
import Contact from "@/components/contact/Contact";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";

export const metadata = {
  title: "Contact || Diproperti - Real Estate",
  description: "Diproperti || Real Estate",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <Breadcumb pageName="Kontak Admin" />
        <div className="main-content">
          <About />
          <Contact />
        </div>
        <Footer1 />
      </div>
    </>
  );
}

