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
      <li className={pathname === "/" ? "current-menu" : ""}>
        <Link href="/">Home</Link>
      </li>
      <li
        className={pathname === "/list-properti" ? "current-menu" : ""}>
        <Link href="/list-properti">Properti</Link>
      </li>
      <li className={pathname === "/komparasi" ? "current-menu" : ""}>
        <Link href="/komparasi">Komparasi</Link>
      </li>
      <li className={pathname === "/bunga-flat" ? "current-menu" : ""}>
        <Link href="/bunga-flat">Bunga Flat</Link>
      </li>
      <li className={pathname === "/list-artikel" ? "current-menu" : ""}>
        <Link href="/list-artikel">Artikel</Link>
      </li>
    </>
  );
}
