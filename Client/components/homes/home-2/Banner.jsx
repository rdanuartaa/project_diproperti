import React from "react";
import Image from "next/image";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";
export default function Banner() {
  return (
    <section className="section-appraisal tf-spacing-1">
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
                    Kami bantu pasarkan properti Anda dengan cepat, aman, dan
                    harga terbaik. Konsultasi GRATIS dengan tim kami sekarang
                    juga.
                  </p>
                </div>

                {/* CTA WhatsApp */}
                <a
                  href="https://wa.me/6281234776677?text=Halo%20Admin,%20saya%20ingin%20menjual%20rumah%20saya.%20Bisa%20dibantu%20untuk%20proses%20pemasaran%20dan%20estimasi%20harga?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tf-btn bg-color-white fw-7 pd-11 wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                >
                  Yuk Konsultasi Sekarang
                </a>

                <div className="person">
                  <Image
                    className="wow animate__fadeInRight animate__animated"
                    data-wow-duration="2s"
                    alt="agent"
                    width={346}
                    height={499}
                    src="/images/section/person-2.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
