"use client";
import React, { useEffect } from "react";

export default function AttentionModal({
  isOpen,
  onClose,
  title = "Perhatian!",
  message,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

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
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{
          maxWidth: "520px",
          width: "100%",
          pointerEvents: "none",
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.75rem",
              boxShadow: "0 8px 24px rgba(217, 119, 6, 0.25)",
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
              style={{ color: "#d97706" }}
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>

          <h3
            style={{
              color: "#111827",
              fontSize: "3rem",
              fontWeight: "700",
              margin: "0 0 0.75rem",
              lineHeight: "1.2",
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </h3>

          <p
            style={{
              color: "#4b5563",
              fontSize: "2rem",
              lineHeight: "1.6",
              margin: "0 0 2.25rem",
              maxWidth: "90%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
