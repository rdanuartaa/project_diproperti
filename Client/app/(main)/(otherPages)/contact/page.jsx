import About from "@/components/contact/About";
import Breadcumb from "@/components/common/Breadcumb";
import Contact from "@/components/contact/Contact";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import React from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Kontak Admin",
  description:
    "Hubungi admin Diproperti untuk bantuan pencarian properti, pengajuan jual properti, atau informasi layanan.",
  path: "/contact",
});
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
