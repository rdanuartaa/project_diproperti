import { allProperties } from "./properties";

export const homes = [
  { href: "/", label: "Halaman Beranda 02", isCurrent: true },
];

export const propertyLinks = [
  {
    title: "Tata Letak",
    submenu: [
      { href: "/property-grid-full-width", label: "Grid - Lebar Penuh" },
      { href: "/property-gird-top-search", label: "Grid - Pencarian Atas" },
      {
        href: "/property-gird-left-sidebar",
        label: "Grid - Sidebar Kiri",
      },
      {
        href: "/property-gird-right-sidebar",
        label: "Grid - Sidebar Kanan",
      },
      { href: "/property-list-full-width", label: "Daftar - Lebar Penuh" },
      { href: "/property-list-top-search", label: "Daftar - Pencarian Atas" },
      {
        href: "/property-list-left-sidebar",
        label: "Daftar - Sidebar Kiri",
      },
      {
        href: "/property-list-right-sidebar",
        label: "Daftar - Sidebar Kanan",
      },
    ],
  },
  {
    title: "Fitur",
    submenu: [
      { href: "/property-half-map-grid", label: "Properti Peta Separuh Grid" },
      { href: "/property-half-map-list", label: "Properti Peta Separuh Daftar" },
      { href: "/property-half-top-map", label: "Properti Peta Atas" },
      { href: "/property-filter-popup", label: "Popup Filter Properti" },
      {
        href: "/property-filter-popup-left",
        label: "Popup Filter Properti Kiri",
      },
      {
        href: "/property-filter-popup-right",
        label: "Popup Filter Properti Kanan",
      },
    ],
  },
  {
    title: "Detail Listing",
    submenu: [
      {
        href: `/properti/${allProperties[0]?.slug}`,
        label: "Detail Properti 1",
      },
      { href: "/property-detail-v2/1", label: "Detail Properti 2" },
      { href: "/property-detail-v3/1", label: "Detail Properti 3" },
      { href: "/property-detail-v4/1", label: "Detail Properti 4" },
      { href: "/property-detail-v5/1", label: "Detail Properti 5" },
    ],
  },
];

export const otherPages = [
  { href: "/home-loan-process", label: "Proses KPR" },
  { href: "/faq", label: "FAQ" },
  { href: "/compare", label: "Komparasi" },
  { href: "/404", label: "Halaman 404" },
  { href: "/dashboard", label: "Dasbor" },
];

export const blogMenu = [
  { href: "/blog-list", label: "Daftar Artikel" },
  { href: "/blog-grid", label: "Grid Artikel" },
  { href: "/blog-details/1", label: "Detail Artikel" },
];
