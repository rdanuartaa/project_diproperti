import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Halaman Tidak Ditemukan || Diproperti - Properti",
  description: "Diproperti || Properti",
};
export default function page() {
  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content ">
          <Breadcumb pageName="Halaman Tidak Ditemukan" />
          <div className="page-content">
            <div className="tf-container tf-spacing-1 pt-0">
              <div className="error-404 text-center">
                <h1 className="mb-20 title">Maaf, halaman ini tidak ditemukan</h1>
                <p className="mb-40">
                  Kami sudah mencari, tetapi tidak menemukan halaman yang Anda cari. Mari kembali ke halaman yang tepat untuk Anda.
                </p>
                <Link
                  href={"/"}
                  className="tf-btn bg-color-primary rounded-4 pd-3 fw-6 mx-auto"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
          <Cta />
        </div>

        <Footer1 />
      </div>
    </>
  );
}
