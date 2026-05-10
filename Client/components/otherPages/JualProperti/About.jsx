import React from "react";
import Image from "next/image";

export default function About() {
  return (
    <section className="section-contact style-4 pb-0" style={{ paddingTop: "160px" }}>
      <div className="tf-container">
        <div className="row align-items-start">
          <div className="col-md-6">
            <div className="box-contact">
              <div className="heading-section mb-48 mt-0">
                <h2 className="title split-text split-lines-transform">
                  Jual Properti Anda dengan Jangkauan Lebih Luas
                </h2>
                <p className="text-1">
                  Diproperti memberikan kemudahan bagi Anda untuk memasarkan properti 
                  secara profesional. Jangkau ribuan calon pembeli potensial di 
                  seluruh wilayah Jember dan sekitarnya dengan sistem yang terintegrasi.
                </p>
              </div>
              <ul className="list-info">
                <li>
                  <div className="icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8ABAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="content">
                    <div className="sub">Proses Cepat</div>
                    <p>Verifikasi data oleh tim kami dilakukan dalam waktu kurang dari 24 jam.</p>
                  </div>
                </li>
                <li>
                  <div className="icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8ABAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="content">
                    <div className="sub">Aman & Terpercaya</div>
                    <p>Hanya listing yang terverifikasi yang akan tampil untuk menjaga kualitas platform.</p>
                  </div>
                </li>
                <li>
                  <div className="icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8ABAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div className="content">
                    <div className="sub">Gratis Listing</div>
                    <p>Dapatkan eksposur maksimal untuk properti Anda tanpa biaya pendaftaran.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div
              className="image-wrap"
              style={{ position: "relative", width: "100%", height: "520px", borderRadius: "16px", overflow: "hidden", marginTop: "10px" }}
            >
              <Image
                src="/images/diproperti/sell-house.jpg"
                alt="Jual Properti"
                fill
                style={{ objectFit: "cover" }}
                className="lazyload"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
