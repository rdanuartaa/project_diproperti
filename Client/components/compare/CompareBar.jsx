"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCompare } from "./CompareContext";

export default function CompareBar() {
  const router = useRouter();
  const {
    compareList,
    isBarOpen,
    setIsBarOpen,
    removeFromCompare,
    clearCompare,
    MAX_COMPARE,
  } = useCompare();

  const handleCompare = () => {
    const slugs = compareList
      .map((p) => p.slug?.trim())
      .filter(Boolean)
      .join(",");
    
    if (!slugs) {
      alert("Pilih minimal 2 properti untuk dibandingkan");
      return;
    }

    router.push(`/komparasi?slugs=${slugs}`);
  };

  // ✅ Redirect ke halaman listing untuk menambah properti
  const handleAddProperty = () => {
    router.push("/list-properti");
  };

  const handleClearAll = () => {
    clearCompare();
    router.push("/komparasi");
  };

  const emptySlots = MAX_COMPARE - compareList.length;

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div
        className="compare-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9990,
          transform: isBarOpen
            ? "translateY(0)"
            : "translateY(calc(100% - 44px))",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Toggle tab */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setIsBarOpen(!isBarOpen)}
            style={{
              background: "var(--Primary, #1a3c6e)",
              color: "#fff",
              border: "none",
              borderRadius: "10px 10px 0 0",
              padding: "6px 20px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span></span>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              Komparasi ({compareList.length})
            </span>
            <span
              style={{
                display: "inline-block",
                transform: isBarOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              ▲
            </span>
          </button>
        </div>

        {/* Bar body */}
        <div
          style={{
            background: "#fff",
            borderTop: "2px solid var(--Primary, #1a3c6e)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* Attention note */}
          <div style={{ minWidth: "220px", maxWidth: "360px", marginRight: "16px" }}>
            <h6 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1a1a2e" }}>
              Bandingkan Properti
            </h6>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#6b7280" }}>
              Pilih 2 hingga 3 properti untuk dibandingkan. Hindari membandingkan tipe
              atau status yang berbeda (misalnya Rumah dan Ruko/ Dijual dan Disewa).
            </p>
          </div>

          {/* Slot properti yang dipilih */}
          <div style={{ display: "flex", gap: "12px", flex: 1, flexWrap: "wrap" }}>
            {compareList.map((prop) => (
              <div
                key={prop.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f0f7ff",
                  border: "1.5px solid var(--Primary, #1a3c6e)",
                  borderRadius: "10px",
                  padding: "6px 10px 6px 6px",
                  minWidth: "180px",
                  maxWidth: "220px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    aspectRatio: "4 / 3",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <Image
                    src={prop.images?.[0]?.full_url || "/images/section/compare-1.jpg"}
                    alt={prop.title}
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "#1a1a2e",
                    }}
                  >
                    {prop.title}
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
                    {prop.city}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCompare(prop.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#e74c3c",
                    fontSize: "14px",
                    padding: "2px",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Slot kosong — klik redirect ke listing */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={handleAddProperty}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#fafafa",
                  border: "1.5px dashed #ccc",
                  borderRadius: "10px",
                  padding: "6px 16px",
                  minWidth: "160px",
                  cursor: "pointer",
                  color: "#aaa",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
                Tambah Properti
              </button>
            ))}
          </div>

          {/* Tombol aksi */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleCompare}
              disabled={compareList.length < 2}
              className="tf-btn style-border pd-23"
              aria-disabled={compareList.length < 2}
            >
              Bandingkan Sekarang
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="tf-btn style-border pd-23 btn-cancel-danger"
            >
              Hapus Semua
            </button>
          </div>
        </div>
      </div>
    </>
  );
}