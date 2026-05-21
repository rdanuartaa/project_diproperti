import Image from "next/image";
import React from "react";

export default function Cta() {
  return (
    <section className="section-CTA style-2 tf-spacing-1">
      <div className="tf-container">
        <div className="row relative">
          <div className="col-12">
            <div className="content-inner">
              <div className="content">
                <div className="logo">
                  <Image
                    alt=""
                    width={272}
                    height={84}
                    src="/images/logo/logo-white@2x.png"
                  />
                </div>
                <div className="heading-section mb-30">
                  <h2 className="title text_white split-text effect-right">
                    Temukan Agen Properti Lokal <br />
                    Hari Ini
                  </h2>
                  <p
                    className="text-1 text_white wow animate__fadeInUp animate__animated"
                    data-wow-duration="1s"
                    data-wow-delay="0s"
                  >
                    Jika Anda ingin membeli atau menjual rumah, kami siap membantu
                    the <br />
                    most money possible.
                  </p>
                </div>
                <a
                  href="#"
                  className="tf-btn style-2 fw-6 pd-25 wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                  data-wow-delay="0s"
                >
                  Temukan agen di lokasi Anda
                  <i className="icon-MagnifyingGlass fw-6" />
                </a>
              </div>
            </div>
            <div
              className="person wow animate__fadeInRight animate__animated"
              data-wow-duration="1s"
              data-wow-delay="0s"
            >
              <Image
                alt=""
                width={346}
                height={499}
                src="/images/section/person-2.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
