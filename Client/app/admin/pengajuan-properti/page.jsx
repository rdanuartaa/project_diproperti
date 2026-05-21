import React from "react";
import PropertySubmissions from "@/components/dashboard/PropertySubmissions";

export const metadata = {
  title: "Pengajuan Properti || Diproperti - Properti",
  description: "Pengajuan properti dari user.",
};

export default function page() {
  return <PropertySubmissions />;
}
