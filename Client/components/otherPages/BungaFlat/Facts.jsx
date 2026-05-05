import OdometerComponent from "@/components/common/OdometerComponent";
import { counters2 } from "@/data/facts";
import Image from "next/image";
import React from "react";

export default function Facts() {
  return (
    <section className="section-box-team tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-6">
            <div className="content-inner">

              {/* ✅ HEADING BARU */}
              <div className="heading-section mb-48">
                <h2
                  className="title wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                  data-wow-delay="0s"
                >
                  Simulasi KPR Jadi Lebih Mudah
                </h2>
              </div>

              {/* ✅ DESKRIPSI BARU */}
              <div
                className="content mb-48 wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0s"
              >
                <p className="text-1 description-1 mb-14">
                  Menghitung cicilan KPR bisa terasa membingungkan, terutama
                  jika Anda belum familiar dengan perhitungan bunga. Dengan
                  kalkulator KPR bunga flat, Anda bisa mengetahui estimasi
                  cicilan bulanan dengan cepat dan akurat.
                </p>

                <p className="description-2 text-1 mb-24">
                  Cukup masukkan harga properti, uang muka, bunga, dan tenor —
                  sistem akan langsung menghitung total cicilan Anda.
                </p>

                <a
                  href="#calculator"
                  className="tf-btn bg-color-primary fw-7 pd-12 wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                  data-wow-delay="0s"
                >
                  Coba Kalkulator
                </a>
              </div>

              {/* ✅ COUNTER (TETAP STRUKTUR ASLI) */}
              <div className="wrap-counter">
                {counters2.map((elm, i) => (
                  <div key={i} className="counter-item style-2">
                    <div className="count">
                      <div className="icons">
                        <i className={elm.icon} />
                      </div>
                      <div className="counter-number">
                        <div className="odometer style-2 style-2-1">
                          <OdometerComponent max={elm.number} />
                          {elm.hasSubNumber && <span>{elm.subNumber}</span>}
                        </div>
                        <span className="sub plus">{elm.subText}</span>
                      </div>
                      <p className="text-4">{elm.label}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ✅ GAMBAR TETAP (TIDAK DIUBAH) */}
          <div className="col-lg-6">
            <div className="wrap-image">
              <div
                className="image-wrap img-1 hover-img-wrap wow animate__zoomIn animate__animated"
                data-wow-duration="1.5s"
                data-wow-delay="0s"
              >
                <Image
                  className="lazyload parallax-img"
                  data-src="/images/diproperti/bungaflat1.jpg"
                  alt=""
                  width={400}
                  height={509}
                  src="/images/diproperti/bungaflat1.jpg"
                />
              </div>

              <div
                className="image-wrap img-2 hover-img-wrap wow animate__zoomIn animate__animated"
                data-wow-duration="1.5s"
                data-wow-delay="0s"
              >
                <Image
                  className="lazyload parallax-img"
                  data-src="/images/diproperti/bungaflat2.jpg"
                  alt=""
                  width={400}
                  height={509}
                  src="/images/diproperti/bungaflat2.jpg"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
