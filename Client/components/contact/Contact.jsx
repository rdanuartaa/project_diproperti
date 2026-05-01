"use client";
import React, { useState } from "react";
import DropdownSelect from "../common/DropdownSelect";

export default function Contact() {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  const ADMIN_PHONE = "6281234776677";

  const handleWhatsApp = () => {
    const text = `
Halo Admin DiProperti,

Nama: ${name || "-"}
Kebutuhan: ${interest || "-"}

Pesan:
${message || "-"}

Mohon informasi lebih lanjut. Terima kasih 🙏
    `;

    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <section className="section-contact ">
      <div className="box">
        <div className="tf-container tf-spacing-1">
          <div className="row">
            <div className="col-12">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="form-contact"
              >
                <div className="heading-section">
                  <h2 className="title">Hubungi Kami</h2>
                  <p className="text-1">
                    Silakan isi form berikut, Anda akan langsung terhubung ke
                    WhatsApp kami.
                  </p>
                </div>

                <div className="row">
                  {/* Nama */}
                  <div className="col-md-6 mb-12">
                    <fieldset>
                      <label>Nama:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nama Anda"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </fieldset>
                  </div>

                  {/* Kebutuhan */} 
                  <div className="col-md-6 mb-12">
                    <div className="select w-full">
                      <label className="text-1 fw-6 mb-12">
                        Kebutuhan Anda?
                      </label>

                      <DropdownSelect
                        options={[
                          "Pilih",
                          "Beli Properti",
                          "Jual Properti",
                          "Sewa",
                          "Informasi",
                        ]}
                        onChange={(val) => setInterest(val)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pesan */}
                <div className="col-12">
                  <fieldset className="box-fieldset">
                    <label>Pesan:</label>
                    <textarea
                      name="pesan"
                      rows={5}
                      className="textarea"
                      placeholder="Tulis pesan Anda..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </fieldset>
                </div>

                {/* Button */}
                <div className="send-wrap">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="tf-btn bg-color-primary fw-7 pd-8 w-100 mb-4"
                  >
                    Kirim via WhatsApp
                  </button>
                </div>

                <p className="text-muted mt-4 text-center">
                  *Anda akan langsung diarahkan ke WhatsApp admin
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
