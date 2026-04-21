"use client";
import { blogMenu, homes, otherPages, propertyLinks } from "@/data/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Nav() {
  const pathname = usePathname();
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
      <li className={pathname === "/home02" ? "current-menu" : ""}>
        <Link href="/home02">Home</Link>
      </li>
      <li className={pathname === "/property-gird-right-sidebar" ? "current-menu" : ""}>
        <Link href="/property-gird-right-sidebar">Properti</Link>
      </li>
      <li className={pathname === "/compare" ? "current-menu" : ""}>
        <Link href="/compare">Komparasi</Link>
      </li>
      <li className={pathname === "/bunga-flat" ? "current-menu" : ""}>
        <Link href="/bunga-flat">Bunga Flat</Link>
      </li>
      <li className={pathname.startsWith("/blog") ? "current-menu" : ""}>
        <Link href="/blog-grid">Artikel</Link>
      </li>
    </>
  );
}