import Link from "next/link";
import React from "react";

export default function PageTitle() {
  return (
    <div
      className="page-title style-2"
      style={{
        backgroundImage: "url('/images/diproperti/jualproperti.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
        }}
      />

      <div className="tf-container">
        <div className="row justify-center">
          <div className="col-lg-8">
            <div className="content-inner">
              <div className="heading-title">
                <h2 className="title text_white">Jual Properti</h2>
                <ul className="breadcrumb justify-center">
                  <li>
                    <Link className="home fw-6 text-color-3" href={`/`}>Beranda</Link>
                  </li>
                  <li className="text_white">Jual Properti</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
