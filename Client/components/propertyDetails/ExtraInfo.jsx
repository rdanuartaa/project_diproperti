import React from "react";

export default function ExtraInfo({ property }) {
  // ✅ Fallback jika property belum tersedia
  if (!property) {
    return (
      <>
        <div className="wg-title text-11 fw-6 text-color-heading">
          Detail Properti
        </div>
        <div className="content">
          <p className="description text-1">Memuat informasi...</p>
        </div>
        <div className="box">
          <ul>
            {[...Array(5)].map((_, i) => (
              <li key={i} className="flex">
                <p className="fw-6">-</p>
                <p>-</p>
              </li>
            ))}
          </ul>
          <ul>
            {[...Array(5)].map((_, i) => (
              <li key={i} className="flex">
                <p className="fw-6">-</p>
                <p>-</p>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  // ✅ Helper: Ambil nilai dengan fallback
  const getVal = (val, fallback = "-") => {
    if (val === null || val === undefined || val === "") return fallback;
    return val;
  };

  // ✅ Helper: Format angka dengan titik (ribuan)
  const formatNumber = (num) => {
    if (!num && num !== 0) return "-";
    return Number(num).toLocaleString("id-ID");
  };

  // ✅ Ambil data dari property dan detail
  const detail = property.detail || {};
  const description = property.description || "Tidak ada deskripsi tersedia.";

  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Detail Properti
      </div>
      <div className="content">
        <p className="description text-1">
          {description}
        </p>
      </div>
      <div className="box">
        {/* KOLOM 1 */}
        <ul>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Luas Tanah</p>
            <p>{formatNumber(detail.luas_tanah)} m²</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Luas Bangunan</p>
            <p>{formatNumber(detail.luas_bangunan)} m²</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Sertifikat</p>
            <p>{getVal(property.certificate_type)} ({getVal(property.certificate_status)})</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Listrik</p>
            <p>{formatNumber(detail.electricity_capacity)} Watt</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Jumlah Lantai</p>
            <p>{formatNumber(detail.floors)} Lantai</p>
          </li>
        </ul>
        {/* KOLOM 2 */}
        <ul>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Kamar Tidur</p>
            <p>{formatNumber(detail.bedrooms)}</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Kamar Mandi</p>
            <p>{formatNumber(detail.bathrooms)}</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Ruang Tamu</p>
            <p>{formatNumber(detail.living_rooms)}</p>
          </li>
          <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }}>
            <p className="fw-6" style={{ minWidth: "120px" }}>Ruang Dapur</p>
            <p>{formatNumber(detail.kitchens)}</p>
          </li>
        </ul>
      </div>
    </>
  );
}