"use client";
import { useCompare } from "./CompareContext";

export default function CompareButton({ property, className = "" }) {
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const added = isInCompare(property.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (added) {
      removeFromCompare(property.id);
    } else {
      addToCompare(property);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!added && isFull}
      title={
        added
          ? "Hapus dari komparasi"
          : isFull
          ? "Maksimal 3 properti"
          : "Tambah ke komparasi"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: added || !isFull ? "pointer" : "not-allowed",
        border: added
          ? "1.5px solid var(--Primary, #1a3c6e)"
          : "1.5px solid #ddd",
        background: added ? "var(--Primary, #1a3c6e)" : "#fff",
        color: added ? "#fff" : "#555",
        opacity: !added && isFull ? 0.4 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {added ? (
        <>
          <span>✓</span> Dibandingkan
        </>
      ) : (
        <>
          <span>⊕</span> Bandingkan
        </>
      )}
    </button>
  );
}