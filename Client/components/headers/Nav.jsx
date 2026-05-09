"use client";
import AttentionModal from "@/components/common/AttentionModal";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [attention, setAttention] = useState({ open: false, message: "" });
  const isParentActive = (menus) =>
    menus.some((menu) =>
      menu.submenu
        ? menu.submenu.some((item) =>
            item.submenu
              ? item.submenu.some(
                  (item) => item.href.split("/")[1] === pathname.split("/")[1],
                )
              : item.href.split("/")[1] === pathname.split("/")[1],
          )
        : menu.href.split("/")[1] === pathname.split("/")[1],
    );
  return (
    <>
      <AttentionModal
        isOpen={attention.open}
        onClose={() => setAttention({ open: false, message: "" })}
        title="Perhatian"
        message={attention.message}
      />
      <li className={pathname === "/" ? "current-menu" : ""}>
        <Link href="/">Home</Link>
      </li>
      <li
        className={pathname === "/list-properti" ? "current-menu" : ""}>
        <Link href="/list-properti">Properti</Link>
      </li>
      <li
        className={`has-child ${
          ["/rekomendasi-properti", "/komparasi", "/simulasi-kpr"].includes(pathname)
            ? "current-menu"
            : ""
        }`}
      >
        <a href="#">Fitur</a>
        <ul className="submenu">
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
      <li className={pathname === "/list-artikel" ? "current-menu" : ""}>
        <Link href="/list-artikel">Artikel</Link>
      </li>
      <li className={pathname === "/jual-properti" ? "current-menu" : ""}>
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
