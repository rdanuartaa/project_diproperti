"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer1({ logo = "/images/logo/logo-2@2x.png" }) {
  useEffect(() => {
    const headings = document.querySelectorAll(".title-mobile");

    const toggleOpen = (event) => {
      const parent = event.target.closest(".footer-col-block");
      const content = parent.querySelector(".tf-collapse-content");

      if (parent.classList.contains("open")) {
        parent.classList.remove("open");
        content.style.height = "0px";
      } else {
        parent.classList.add("open");
        content.style.height = content.scrollHeight + 10 + "px";
      }
    };

    headings.forEach((heading) => {
      heading.addEventListener("click", toggleOpen);
    });

    return () => {
      headings.forEach((heading) => {
        heading.removeEventListener("click", toggleOpen);
      });
    };
  }, []);

  return (
    <footer id="footer">
      <div className="tf-container">
        <div className="row">
          {/* TOP */}
          <div className="col-12">
            <div className="footer-top">
              <div className="footer-logo">
                <Link href={`/`}>
                  <Image alt="logo-footer" src={logo} width={200} height={60} />
                </Link>
              </div>

              <div className="wrap-contact-item">
                <div className="contact-item">
                  <div className="icons">
                    <i className="icon-phone-2" />
                  </div>
                  <div className="content">
                    <div className="title text-1">Siap Membantu 24 Jam</div>
                    <h6 className="fw-4" style={{ maxWidth: "300px" }}>
                      Tim kami siap menjawab pertanyaan Anda kapan saja
                    </h6>
                  </div>
                </div>

                {/* Layanan 2 */}
                <div className="contact-item">
                  <div className="icons">
                    <i className="icon-home" />
                  </div>
                  <div className="content">
                    <div className="title text-1">Temukan Properti Terbaik</div>
                    <h6 className="fw-4" style={{ maxWidth: "300px" }}>
                      Kami bantu Anda menemukan rumah sesuai kebutuhan
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="footer-main">
            <div className="row">
              {/* Navigasi */}
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block">
                  <h5 className="title title-desktop">Navigasi</h5>
                  <h5 className="title title-mobile">Navigasi</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/">Beranda</Link>
                    </li>
                    <li>
                      <Link href="/list-properti">Properti</Link>
                    </li>
                    <li>
                      <Link href="/compare">Komparasi</Link>
                    </li>
                    <li>
                      <Link href="/bunga-flat">Simulasi KPR</Link>
                    </li>
                    <li>
                      <Link href="/list-artikel">Artikel</Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Fitur Unggulan */}
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block">
                  <h5 className="title title-desktop">Fitur</h5>
                  <h5 className="title title-mobile">Fitur</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/list-properti?sort=terbaru">
                        Properti Terbaru
                      </Link>
                    </li>
                    <li>
                      <Link href="/list-properti?sort=populer">
                        Properti Populer
                      </Link>
                    </li>
                    <li>
                      <Link href="/compare">Bandingkan Properti</Link>
                    </li>
                    <li>
                      <Link href="/bunga-flat">Hitung KPR</Link>
                    </li>
                    <li>
                      <Link href="/list-artikel">Informasi Terbaru</Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bantuan */}
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block">
                  <h5 className="title title-desktop">Bantuan</h5>
                  <h5 className="title title-mobile">Bantuan</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/faq">FAQ</Link>
                    </li>
                    <li>
                      <Link href="/contact">Kontak</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list">
                  <h5 className="title mb-19">Hubungi Admin</h5>

                  <p className="text-1 mb-15">
                    Butuh bantuan atau ingin menanyakan properti? Tim kami siap
                    membantu Anda menemukan pilihan terbaik.
                  </p>

                  {/* ✅ Tombol WhatsApp - Text biru, hover jadi solid biru */}
                  <a
                    href="https://wa.me/6281234776677?text=Halo%20admin,%20saya%20ingin%20bertanya%20tentang%20properti%20yang%20tersedia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tf-btn wa-outline-btn"
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 23px",
                      height: "54px",
                    }}
                  >
                    Hubungi via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="col-12">
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="fw-7">DIPROPERTI REAL ESTATE</span>. All rights
              reserved.
            </p>

            <div className="wrap-social">
              <div className="text-3 fw-6 text_white">Follow us</div>
              <ul className="tf-social">
                {/* WhatsApp */}
                <li>
                  <a
                    href="https://wa.me/6281234776677"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn whatsapp"
                    title="Chat via WhatsApp"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.52 3.48A11.94 11.94 0 0012.01 0C5.39 0 .02 5.37.02 12c0 2.12.56 4.19 1.63 6.01L0 24l6.2-1.62A11.93 11.93 0 0012.01 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.49-8.52zM12.01 21.82c-1.88 0-3.73-.5-5.35-1.45l-.38-.22-3.68.96.98-3.58-.25-.37a9.79 9.79 0 01-1.5-5.16c0-5.41 4.4-9.81 9.82-9.81 2.62 0 5.08 1.02 6.93 2.88a9.77 9.77 0 012.87 6.93c0 5.42-4.4 9.82-9.82 9.82zm5.4-7.36c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.36.22-.66.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.47.13-.62.14-.14.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.65-.93-2.27-.24-.58-.48-.5-.68-.5h-.58c-.2 0-.52.07-.8.37s-1.05 1.02-1.05 2.5c0 1.48 1.08 2.91 1.23 3.11.15.2 2.12 3.24 5.14 4.55.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                    </svg>
                  </a>
                </li>

                {/* Instagram */}
                <li>
                  <a
                    href="https://www.instagram.com/di.properti/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn instagram"
                    title="Visit Instagram"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 2A3.75 3.75 0 004 7.75v8.5A3.75 3.75 0 007.75 20h8.5A3.75 3.75 0 0020 16.25v-8.5A3.75 3.75 0 0016.25 4h-8.5zm9.75 1.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
                    </svg>
                  </a>
                </li>

                {/* TikTok (punya kamu) */}
                <li>
                  <a
                    href="https://www.tiktok.com/@di.properti" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn tiktok"
                    title="Share via TikTok"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
