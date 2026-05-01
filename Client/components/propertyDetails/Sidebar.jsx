"use client";
import React, { useState } from "react";
import Image from "next/image";

export default function Sidebar({ property }) {
  // State untuk input user
  const [senderName, setSenderName] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Nomor WhatsApp admin (format internasional tanpa + atau -)
  const ADMIN_PHONE = "6281234776677";

  // Format harga singkat
  const formatPrice = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "Hubungi Agen";
    const formatUnit = (n) => {
      const rounded = Math.round(n * 10) / 10;
      const text =
        rounded % 1 === 0
          ? String(rounded).replace(/\.0$/, "")
          : String(rounded);
      return text.replace(".", ",");
    };
    if (num >= 1_000_000_000)
      return `Rp ${formatUnit(num / 1_000_000_000)} milyar`;
    if (num >= 1_000_000) return `Rp ${formatUnit(num / 1_000_000)} juta`;
    if (num >= 1_000) return `Rp ${formatUnit(num / 1_000)} ribu`;
    return `Rp ${num}`;
  };

  // Generate pesan WhatsApp dengan detail properti + input user
  const generateWhatsAppMessage = () => {
    if (!property) return "Halo, saya tertarik dengan properti ini.";

    const title = property.title || "Properti";
    const price = formatPrice(property.price);
    const location =
      [property.kecamatan, property.city].filter(Boolean).join(", ") || "-";
    const type =
      property.type === "rumah"
        ? "Rumah"
        : property.type === "ruko"
          ? "Ruko"
          : property.type === "kos"
            ? "Kos"
            : property.type === "tanah"
              ? "Tanah"
              : property.type || "-";
    const listingType =
      property.listing_type === "jual" ? "Dijual" : "Disewakan";

    const detail = property.detail || {};
    const bedrooms = detail.bedrooms ?? "-";
    const bathrooms = detail.bathrooms ?? "-";
    const luasBangunan = detail.luas_bangunan
      ? `${detail.luas_bangunan} m²`
      : "-";

    // Bagian 1: Pembuka dengan nama user (jika diisi)
    const opening = senderName.trim()
      ? `Halo Admin, saya ${senderName.trim()}. Saya tertarik dengan properti berikut:`
      : `Halo Admin, saya tertarik dengan properti berikut:`;

    // Bagian 2: Detail properti (selalu tampil)
    const propertyDetails = `
  *${title}*
• Harga: ${price}
• Lokasi: ${location}
• Tipe: ${type} - ${listingType}

 Detail:
• Kamar Tidur: ${bedrooms}
• Kamar Mandi: ${bathrooms}
• Luas Bangunan: ${luasBangunan}`;

    // Bagian 3: Pesan tambahan dari user (jika diisi)
    const additionalNote = customMessage.trim()
      ? `\n\n Pesan: ${customMessage.trim()}`
      : "";

    // Bagian 4: Penutup
    const closing = `\n\nMohon informasi lebih lanjut. Terima kasih! 🙏`;

    return `${opening}${propertyDetails}${additionalNote}${closing}`;
  };

  // Handle klik tombol WhatsApp
  const handleWhatsAppClick = (e) => {
    e.preventDefault();

    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodedMessage}`;

    // Buka WhatsApp di tab baru
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Handle reset form setelah kirim (opsional)
  const handleReset = () => {
    setSenderName("");
    setCustomMessage("");
  };

  return (
    <div className="tf-sidebar sticky-sidebar">
      <form
        className="form-contact-seller mb-30"
        onSubmit={(e) => e.preventDefault()}
      >
        <h4 className="heading-title mb-30">Hubungi Admin</h4>

        {/* Info Admin */}
        <div className="seller-info mb-4">
          <div className="avartar">
            <Image
              alt="Admin"
              src="/images/avatar/seller.jpg"
              width={200}
              height={200}
              className="rounded-circle"
            />
          </div>
          <div className="content">
            <h6 className="name">Admin Diproperti</h6>
            <ul className="contact">
              <li>
                <i className="icon-phone-1" />
                <span>+62 812-3477-6677</span>
              </li>
              <li>
                <i className="icon-mail" />
                <a href="mailto:dirpoperti@gmail.com">dirpoperti@gmail.com</a>
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
            name="sender_name"
            id="sender_name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </fieldset>

        {/* Input Pesan Tambahan */}
        <fieldset className="mb-30">
          <textarea
            name="custom_message"
            cols={30}
            rows={4}
            className="form-control"
            placeholder="Pesan tambahan (opsional)..."
            id="custom_message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </fieldset>

        {/* Tombol WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="tf-btn style-border pd-23 w-full"
        >
          Kirim via WhatsApp
        </button>
        <p className="text-muted d-block mt-2 text-center">
          *Detail properti akan otomatis terlampir
        </p>
      </form>
    </div>
  );
}
