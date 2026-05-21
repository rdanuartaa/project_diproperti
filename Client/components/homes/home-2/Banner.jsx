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
                    className="text-1 text_white wow animate__fadeInUp animate__animated"
                    data-wow-duration="1.5s"
                    style={{ maxWidth: "600px" }} // biar gak kepanjangan
                  >
                    Pasarkan properti Anda langsung dari platform kami dengan
                    proses mudah, rapi, dan terpantau oleh admin.
                  </p>
                </div>

                <Link
                  href="/jual-properti"
                  className="tf-btn wa-outline-btn fw-7 wow animate__fadeInUp animate__animated"
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

        .home-appraisal-banner .wg-appraisal .content {
          background-color: #78afe3 !important;
          background-image: linear-gradient(
            90deg,
            #5f9cda 0%,
            #78afe3 58%,
            #9cc8ef 100%
          ) !important;
          padding-top: 82px !important;
          padding-bottom: 82px !important;
        }

        .home-appraisal-banner .wa-outline-btn {
          height: 54px;
          padding: 0 23px;
          border: 1px solid #ffffff !important;
          background: transparent !important;
          color: #ffffff !important;
          border-radius: 15px;
        }

        .home-appraisal-banner .wa-outline-btn::after {
          background-color: #ffffff !important;
        }

        .home-appraisal-banner .wa-outline-btn:hover {
          color: var(--Primary) !important;
          border-color: #ffffff !important;
        }

        @media (max-width: 767px) {
          .home-appraisal-banner {
            padding-top: 24px !important;
          }

          .home-appraisal-banner .wg-appraisal .content {
            padding-top: 56px !important;
            padding-bottom: 56px !important;
          }
        }
      `}</style>
    </section>
  );
}
