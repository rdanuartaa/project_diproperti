"use client";
import AttentionModal from "@/components/common/AttentionModal";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

export default function Nav({ variant = "desktop" }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [attention, setAttention] = useState({ open: false, message: "" });
  const isMobile = variant === "mobile";
  const isFiturActive = [
    "/rekomendasi-properti",
    "/komparasi",
    "/simulasi-kpr",
  ].includes(pathname);
  const getTopLevelActiveClass = (path) =>
    pathname === path
      ? isMobile
        ? "current-menu-item"
        : "current-menu"
      : "";
  return (
    <>
      <AttentionModal
        isOpen={attention.open}
        onClose={() => setAttention({ open: false, message: "" })}
        title="Perhatian"
        message={attention.message}
      />
      <li className={getTopLevelActiveClass("/")}>
        <Link href="/">Home</Link>
      </li>
      <li className={getTopLevelActiveClass("/list-properti")}>
        <Link href="/list-properti">Properti</Link>
      </li>
      <li
        className={`${
          isMobile ? "menu-item-has-children-mobile" : "has-child"
        } ${
          isFiturActive
            ? isMobile
              ? "current-menu-item"
              : "current-menu"
            : ""
        }`}
      >
        {isMobile ? (
          <a
            href="#mobile-fitur"
            data-bs-toggle="collapse"
            data-bs-target="#mobile-fitur"
            aria-expanded={isFiturActive ? "true" : "false"}
            className={isFiturActive ? "" : "collapsed"}
          >
            Fitur
          </a>
        ) : (
          <a href="#">Fitur</a>
        )}
        <ul
          id={isMobile ? "mobile-fitur" : undefined}
          className={
            isMobile
              ? `sub-mobile collapse${isFiturActive ? " show" : ""}`
              : "submenu"
          }
        >
          <li className={pathname === "/rekomendasi-properti" ? "current-item" : ""}>
            <Link href="/rekomendasi-properti">Rekomendasi</Link>
          </li>
          <li className={pathname === "/komparasi" ? "current-item" : ""}>
            <Link href="/komparasi">Komparasi</Link>
          </li>
          <li className={pathname === "/simulasi-kpr" ? "current-item" : ""}>
            <Link href="/simulasi-kpr">Simulasi KPR</Link>
          </li>
        </ul>
      </li>
      <li className={getTopLevelActiveClass("/list-artikel")}>
        <Link href="/list-artikel">Artikel</Link>
      </li>
      <li className={getTopLevelActiveClass("/jual-properti")}>
        <Link
          href="/jual-properti"
          onClick={(event) => {
            if (isAuthenticated || loading) return;
            event.preventDefault();
            setAttention({
              open: true,
              message: "Anda harus login terlebih dahulu untuk menjual properti.",
            });
            window.location.href = `${API_URL}/auth/google/redirect`;
          }}
        >
          Jual Properti
        </Link>
      </li>
    </>
  );
}
