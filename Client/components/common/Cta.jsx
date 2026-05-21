import React from "react";
import Image from "next/image";
export default function Cta() {
  return (
    <section className="section-CTA">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="content-inner">
              <Image
                alt=""
                src="/images/section/cta.png"
                width={216}
                height={312}
              />
              <div className="content">
                <h4 className="text_white mb-8">
                  Temukan Agen Properti Lokal Hari Ini
                </h4>
                <p className="text_white text-1">
                  Jika Anda ingin membeli atau menjual rumah, kami siap membantu Anda mendapatkan hasil terbaik.
                </p>
              </div>
              <a href="#" className="tf-btn style-2 fw-6">
                Temukan agen di lokasi Anda
                <i className="icon-MagnifyingGlass fw-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
