"use client";
import React from "react";

export default function SuccessModal({ isOpen, onClose, title = "Berhasil!", message }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%",
        minHeight: "100dvh",
        backgroundColor: "rgba(0, 0, 0, 0.3)", 
        backdropFilter: "blur(12px)", 
        WebkitBackdropFilter: "blur(12px)", 
        zIndex: 9999, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.3s ease"
      }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        style={{ 
          maxWidth: "500px", 
          width: "100%", 
          pointerEvents: "none",
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content" 
          style={{ 
            pointerEvents: "auto", 
            borderRadius: "24px", 
            border: "none", 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "2.5rem 2rem 2rem",
            textAlign: "center",
            background: "#ffffff",
            overflow: "hidden"
          }}
        >
          {/* Success Icon */}
          <div 
            style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.75rem",
              boxShadow: "0 8px 24px rgba(22, 163, 74, 0.25)"
            }}
          >
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "#16a34a" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title */}
          <h3 
            style={{ 
              color: "#111827",
              fontSize: "3rem", // Teks lebih besar & tegas
              fontWeight: "700",
              margin: "0 0 0.75rem",
              lineHeight: "1.2",
              letterSpacing: "-0.025em"
            }}
          >
            {title}
          </h3>

          {/* Message */}
          <p 
            style={{ 
              color: "#4b5563",
              fontSize: "2rem", // Teks deskripsi lebih besar & nyaman dibaca
              lineHeight: "1.6",
              margin: "0 0 2.25rem",
              maxWidth: "90%",
              marginLeft: "auto",
              marginRight: "auto"
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}