import HomeClient from "./HomeClient";
import { createPageMetadata } from "./seo";

export const metadata = createPageMetadata({
  title: "Diproperti - Cari, Bandingkan, dan Jual Properti di Jember",
  description:
    "Cari properti, bandingkan pilihan, hitung simulasi KPR, baca artikel, dan pasarkan properti Anda melalui Diproperti.",
  path: "/",
});

export default function Home02Page() {
  return <HomeClient />;
}
