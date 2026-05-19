import React from "react";
import Image from "next/image";
import Link from "next/link";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";
export default function Banner() {
  return (
    <section className="section-appraisal tf-spacing-1 home-appraisal-banner">
      <div className="wg-appraisal style-2">
        <div className="tf-container">
          <div className="row">
            <div className="col-12">
              <div className="content">
                <div className="heading-section mb-24">
                  <h2 className="title text_white split-text effect-right">
                    <SplitTextAnimation text="Mau Jual Rumah" />
                    <br />
                    <SplitTextAnimation text="Tanpa Ribet?" />
                  </h2>

                  <p
                    className="text-1 text-color3 wow animate__fadeInUp animate__animated"
                    data-wow-duration="1.5s"
                    style={{ maxWidth: "600px" }} // biar gak kepanjangan
                  >
                    Pasarkan properti Anda langsung dari platform kami dengan
                    proses mudah, rapi, dan terpantau oleh admin.
                  </p>
                </div>

                <Link
                  href="/jual-properti"
                  className="tf-btn bg-color-white fw-7 pd-11 wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                >
                  Jual Properti Sekarang
                </Link>

                <div className="person">
                  <Image
                    className="wow animate__fadeInRight animate__animated"
                    data-wow-duration="2s"
                    alt="agent"
                    width={486}
                    height={650}
                    src="/images/diproperti/womenbannerhome.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .home-appraisal-banner {
          padding-top: 34px !important;
        }

        @media (max-width: 767px) {
          .home-appraisal-banner {
            padding-top: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
