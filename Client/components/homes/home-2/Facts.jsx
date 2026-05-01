import OdometerComponent from "@/components/common/OdometerComponent";
import { counters } from "@/data/facts";
import React from "react";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";

export default function Facts() {
  return (
    <section className="section-realty tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center">
              <h2 className="title text_white split-text effect-right">
                <SplitTextAnimation text="Solusi Jual & Beli" />
                <br />
                <SplitTextAnimation text="Properti Lebih Mudah" />
              </h2>

              <p
                className="text-1 text-color3 wow animate__fadeInUp animate__animated"
                data-wow-duration="1.5s"
              >
                Ratusan properti telah berhasil terjual dan ditemukan melalui platform kami.
                <br />
                Kami membantu Anda mendapatkan pembeli atau properti impian dengan lebih cepat dan aman.
              </p>
            </div>
          </div>

          <div className="tf-grid-layout-2 lg-col-4">
            {counters.map((counter, index) => (
              <div key={index} className="counter-item style-1 mx-auto">
                <div className="count text-center">
                  <div className="counter-number">

                    {/* ✅ FIX: pakai key + pastikan number */}
                    <div className="odometer odometer-auto-theme">
                      <OdometerComponent
                        key={`${index}-${counter.value}`}
                        max={Number(counter.value) || 0}
                      />
                    </div>

                    {counter.suffix && (
                      <span className="sub">{counter.suffix}</span>
                    )}
                  </div>

                  <p className="text-1 text_white">
                    {counter.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
