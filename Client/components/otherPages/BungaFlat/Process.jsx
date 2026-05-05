import Link from "next/link";
import React from "react";

export default function Process() {
  return (
    <section className="section-selling-home style-2 tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            {/* ✅ HEADING BARU */}
            <div className="heading-section text-center mb-48">
              <h2
                className="title wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0s"
              >
                Cara Menghitung KPR Bunga Flat
              </h2>
              <p
                className="text-1 wow animate__fadeInUp animate__animated"
                data-wow-duration="1.5s"
                data-wow-delay="0s"
              >
                Pahami langkah sederhana menghitung cicilan KPR dengan metode
                bunga flat agar Anda bisa memperkirakan pembayaran setiap bulan
                secara akurat.
              </p>
            </div>

            <div className="tf-grid-layout md-col-3">

              {/* STEP 1 */}
              <div className="wrap-box">
                <span className="number">01</span>
                <div className="icons-box style-5 effec-icon">
                  <div className="tf-icon">
                    <svg width={60} height={60} viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20V20H4V4Z" stroke="var(--Primary)" strokeWidth="2"/>
                      <path d="M8 8H16M8 12H16M8 16H12" stroke="var(--Primary)" strokeWidth="2"/>
                    </svg>
                  </div>

                  <h5 className="title text-center">
                    <a href="#">Hitung Pokok Pinjaman</a>
                  </h5>

                  <span className="line" />

                  <p className="text-1 text-center">
                    Kurangi harga properti dengan uang muka (DP) untuk
                    mendapatkan jumlah pinjaman awal yang akan dikenakan bunga.
                  </p>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="wrap-box">
                <span className="number">02</span>
                <div className="icons-box style-5 effec-icon">
                  <div className="tf-icon">
                    <svg width={60} height={60} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="var(--Primary)" strokeWidth="2"/>
                      <path d="M8 16L16 8M9 9H9.01M15 15H15.01" stroke="var(--Primary)" strokeWidth="2"/>
                    </svg>
                  </div>

                  <h5 className="title text-center">
                    <a href="#">Hitung Bunga per Bulan</a>
                  </h5>

                  <span className="line" />

                  <p className="text-1 text-center">
                    Bunga flat dihitung dari pokok pinjaman dikalikan suku bunga
                    tahunan, lalu dibagi 12 untuk mendapatkan bunga per bulan.
                  </p>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="wrap-box">
                <span className="number">03</span>
                <div className="icons-box style-5 effec-icon">
                  <div className="tf-icon">
                    <svg width={60} height={60} viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="6" width="18" height="12" rx="2" stroke="var(--Primary)" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="var(--Primary)" strokeWidth="2"/>
                    </svg>
                  </div>

                  <h5 className="title text-center">
                    <a href="#">Hitung Angsuran Bulanan</a>
                  </h5>

                  <span className="line" />

                  <p className="text-1 text-center">
                    Total angsuran diperoleh dari pokok pinjaman per bulan
                    ditambah bunga per bulan, sehingga cicilan tetap setiap bulan.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
