"use client";
import React, { useState } from "react";
import Image from "next/image";

export default function FaqSidebar() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const ADMIN_PHONE = "6281234776677";

  const handleWhatsApp = () => {
    const text = `
Halo Admin DiProperti,
${name ? `Saya ${name}.` : ""}

Saya tidak menemukan jawaban di FAQ.

${message ? `Pertanyaan saya:\n${message}` : ""}

Mohon bantuannya. Terima kasih 🙏
    `;

    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="tf-sidebar sticky-sidebar">
      <form
        className="form-contact-seller mb-30"
        onSubmit={(e) => e.preventDefault()}
      >
        <h4 className="heading-title mb-30">Tidak menemukan jawaban?</h4>

        {/* Info */}
        <div className="seller-info">
          <div className="avartar">
            <Image
              alt="DiProperti"
              width={200}
              height={200}
              src="/images/avatar/seller.jpg"
            />
          </div>

          <div className="content">
            <h6 className="name">Tim DiProperti</h6>
            <ul className="contact">
              <li>
                <i className="icon-phone-1" />
                <span>+62 812-3477-6677</span>
              </li>
              <li>
                <i className="icon-mail" />
                <a href="mailto:info@diproperti.id">
                  info@diproperti.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Input Nama */}
        <fieldset className="mb-12">
          <input
            type="text"
            className="form-control"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </fieldset>

        {/* Input Pesan */}
        <fieldset className="mb-30">
          <textarea
            rows={5}
            className="form-control"
            placeholder="Tulis pertanyaan Anda..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </fieldset>

        {/* Button */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="tf-btn bg-color-primary w-full"
        >
          Tanya via WhatsApp
        </button>

        <p className="text-muted mt-2 text-center">
          *Anda akan langsung terhubung ke WhatsApp admin
        </p>
      </form>
    </div>
  );
}
