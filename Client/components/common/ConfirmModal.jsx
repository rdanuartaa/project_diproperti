"use client";
import React from "react";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi Hapus",
  message,
  confirmText = "Hapus",
  cancelText = "Batal",
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal show d-block" 
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        backgroundColor: "rgba(0,0,0,0.5)", 
        zIndex: 9999, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        animation: "fadeIn 0.3s ease"
      }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        style={{ 
          maxWidth: "500px", 
          width: "100%", 
          margin: "0 auto", 
          pointerEvents: "none",
          animation: "scaleIn 0.3s ease"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content" 
          style={{ 
            pointerEvents: "auto", 
            borderRadius: "12px", 
            border: "none", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)" 
          }}
        >
          {/* Header */}
          <div 
            className="modal-header border-0 pb-0" 
            style={{ padding: "1.5rem 1.5rem 0" }}
          >
            <h4 className="fw-bold mb-0" style={{ color: "#1f2937", fontSize: "2rem" }}>
              {title}
            </h4>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              style={{ 
                position: "absolute", 
                right: "1.25rem", 
                top: "1.25rem" 
              }} 
              aria-label="Close"
              disabled={isLoading}
            />
          </div>

          {/* Body */}
          <div 
            className="modal-body text-center pt-0 pb-4" 
            style={{ padding: "2rem" }}
          >
            <div 
              className="warning-icon-wrapper"
              style={{ 
                width: "120px", 
                height: "120px", 
                borderRadius: "50%", 
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "2rem auto 2rem"
              }}
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            <p 
              className="mb-0" 
              style={{ 
                fontSize: "1.75rem", 
                lineHeight: "1.6",
                color: "#374151"
              }}
            >
              {message}
            </p>
          </div>

          {/* Footer */}
          <div 
            className="modal-footer border-0 justify-content-center gap-3" 
            style={{ padding: "0 1.5rem 1.5rem" }}
          >
            <button 
              type="button" 
              className="tf-btn style-border pd-23 btn-cancel-danger"
              onClick={onClose} 
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              className="tf-btn style-border pd-23 btn-cancel-danger"
              onClick={onConfirm} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span 
                    className="spinner-border spinner-border-sm" 
                    style={{ width: "1rem", height: "1rem" }}
                  />
                  Loading...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
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
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}