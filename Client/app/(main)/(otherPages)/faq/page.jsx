import Breadcumb from "@/components/common/Breadcumb";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Faqs from "@/components/otherPages/faq/Faqs";

import React from "react";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "FAQ Diproperti",
  description:
    "Temukan jawaban pertanyaan umum tentang penggunaan Diproperti, pengajuan properti, rekomendasi, komparasi, dan simulasi KPR.",
  path: "/faq",
});

export default function page() {
  return (
    <>
      <div id="wrapper" className="counter-scroll">
        <Header1 />
        <Breadcumb pageName="FAQS" />
        <div className="main-content">
          <Faqs />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
