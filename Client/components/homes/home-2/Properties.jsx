"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";
import { Navigation, Pagination } from "swiper/modules";
import { useEffect, useState } from "react";
import { useCompare } from "@/components/compare/CompareContext";
import { api } from "@/lib/api";
import { getPropertyCardMetaItems } from "@/lib/property";
import PropertyViewMeta from "@/components/properties/PropertyViewMeta";
import "swiper/css";
import "swiper/css/pagination";

const fallbackImage = "/images/section/location-23.jpg";

const META_CONFIG_BY_TYPE = {
  rumah: [
    { key: "bedrooms", label: "KT" },
    { key: "bathrooms", label: "KM" },
    { key: "building_type", label: "m²" },
  ],
  villa: [
    { key: "bedrooms", label: "KT" },
    { key: "bathrooms", label: "KM" },
    { key: "building_type", label: "m²" },
  ],
  kos: [
    { key: "room_size", label: "Luas", suffix: "m²" },
    { key: "bathroom_position", label: "KM" },
    { key: "gender_type", label: "Gender" },
  ],
  ruko: [
    { key: "parking_area", label: "PA" },
    { key: "warehouse_area", label: "WA", suffix: "m²" },
    { key: "building_type", label: "m²" },
  ],
  tanah: [
    { key: "zoning", label: "Fungsi" },
    { key: "road_access", label: "Akses" },
    { key: "luas_tanah", label: "LT", suffix: "m²" },
  ],
};

// ✅ Helper functions (sama persis seperti RelatedProperties & PropertyGridItems)
function getImageSrc(property) {
  return property?.images?.[0]?.full_url || property?.imageSrc || fallbackImage;
}

function getLocation(property) {
  return (
    [property?.kecamatan, property?.city].filter(Boolean).join(", ") ||
    property?.location ||
    "Lokasi belum tersedia"
  );
}

function formatHarga(value) {
  const num = Number(String(value).replace(/\./g, ""));
  if (!num) return "Rp 0";
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1).replace(".0", "")}Miliar`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1).replace(".0", "")}Juta`;
  }
  if (num >= 1000) {
    return `Rp ${(num / 1000).toFixed(0)}Ribu`;
  }
  return `Rp ${num}`;
}

function getSewaPeriodLabel(property) {
  const period = String(property?.price_period || "bulan");
  if (period === "3bulan") return "3 bulan";
  if (period === "6bulan") return "6 bulan";
  if (period === "tahun") return "tahun";
  return "bulan";
}

function formatPriceDisplay(property) {
  const base = formatHarga(property?.price);
  if (property?.listing_type !== "sewa") return base;
  if (!property?.price) return base;
  return `${base}/${getSewaPeriodLabel(property)}`;
}

// ✅ Daftar tipe properti untuk filter tabs (sesuai enum di backend)
function getRoomSize(property) {
  const panjang = Number(property?.detail?.panjang_ruangan ?? 0);
  const lebar = Number(property?.detail?.lebar_ruangan ?? 0);
  if (panjang > 0 && lebar > 0) {
    const area = panjang * lebar;
    return Number.isInteger(area)
      ? String(area)
      : String(Number(area.toFixed(2)));
  }
  return property?.building_type;
}

function getMetaValue(property, key) {
  if (key === "bedrooms") return property?.detail?.bedrooms ?? property?.beds;
  if (key === "bathrooms") return property?.detail?.bathrooms ?? property?.baths;
  if (key === "bathroom_position") {
    const position = property?.detail?.bathroom_position;
    if (position === "dalam") return "Dalam";
    if (position === "luar") return "Luar";
    return position;
  }
  if (key === "building_type") {
    return (
      property?.building_type ??
      property?.detail?.luas_bangunan ??
      property?.sqft ??
      property?.detail?.luas_tanah
    );
  }
  if (key === "room_size") return getRoomSize(property);
  if (key === "luas_tanah") return property?.detail?.luas_tanah;
  return property?.detail?.[key];
}

function formatMetaValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

function getPropertyMetaItems(property) {
  const type = property?.type || "rumah";
  const config = META_CONFIG_BY_TYPE[type] || META_CONFIG_BY_TYPE.rumah;

  return config.map((item) => ({
    ...item,
    value: formatMetaValue(getMetaValue(property, item.key)),
  }));
}

const PROPERTY_TYPES = [
  { value: "rumah", label: "Rumah" },
  { value: "villa", label: "Villa" },
  { value: "ruko", label: "Ruko" },
  { value: "kos", label: "Kos" },
  { value: "tanah", label: "Tanah" },
];

export default function Properties() {
  const router = useRouter();
  const [activeType, setActiveType] = useState("rumah");
  const [properties, setProperties] = useState([]);
  const [listingCounts, setListingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();

  useEffect(() => {
    let isMounted = true;

    const fetchListingCounts = async () => {
      try {
        const responses = await Promise.all(
          PROPERTY_TYPES.map((type) =>
            api.get("/properties", {
              params: {
                type: type.value,
                status: "published",
                per_page: 1,
              },
            })
          )
        );

        if (!isMounted) return;

        const counts = PROPERTY_TYPES.reduce((acc, type, index) => {
          const response = responses[index]?.data;
          const data = response?.data || response || [];
          acc[type.value] = Number(
            response?.total ?? (Array.isArray(data) ? data.length : 0)
          );
          return acc;
        }, {});

        setListingCounts(counts);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch property counts:", err);
          setListingCounts({});
        }
      }
    };

    fetchListingCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Fetch properties dari API berdasarkan type filter
  useEffect(() => {
    if (!activeType) return;

    let isMounted = true;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const response = await api.get("/properties", {
          params: {
            type: activeType,
            status: "published",
            per_page: 10,
          },
        });
        
        if (!isMounted) return;
        
        const data = response.data?.data || response.data || [];
        setProperties(data);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch properties:", err);
        setProperties([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => {
      isMounted = false;
    };
  }, [activeType]);

  const handleClick = (typeValue) => {
    setActiveType(typeValue);
  };

  const getListingCountLabel = (typeValue) => {
    const count = listingCounts[typeValue] ?? 0;
    return `${count} Listing`;
  };

  const handleCompareProperty = (property, added) => {
    if (added) {
      removeFromCompare(property.id);
      return;
    }

    const didAdd = addToCompare(property);
    if (!didAdd) return;

    const params = new URLSearchParams();
    if (property?.type) params.set("type", property.type);
    if (property?.listing_type) params.set("listing_type", property.listing_type);

    router.push(`/list-properti${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="section-popular-searches tf-spacing-1">
      <div className="tf-container md">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center mb-48">
              <h2 className="title split-text effect-right">
                <SplitTextAnimation text="Properti Terpopuler" />
              </h2>
              <p className="text-1 split-text split-lines-transform">
                Ratusan pencari properti mewah seperti Anda mengunjungi website kami.
              </p>
            </div>

            {/* ✅ Tabs Filter by Property Type */}
            <div className="widget-tabs style-2">
              <ul className="widget-menu-tab mb-48 overflow-x-auto">
                {PROPERTY_TYPES.map((item, index) => (
                  <li
                    key={index}
                    className={`item-title hover-tooltip ${
                      activeType === item.value ? "active" : ""
                    }`}
                    onClick={() => handleClick(item.value)}
                  >
                    {item.label}
                    <span className="tooltip">
                      {getListingCountLabel(item.value)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="widget-content-tab">
                <div className="widget-content-inner active">
                  
                  {/* Loading State */}
                  {loading && (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Memuat...</span>
                      </div>
                      <p className="mt-2 text-1">Memuat properti...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && properties.length === 0 && (
                    <div className="text-center py-5">
                      <p className="text-1 text-color-default">
                        Tidak ada properti tipe "{PROPERTY_TYPES.find(t => t.value === activeType)?.label}" saat ini.
                      </p>
                    </div>
                  )}

                  {/* ✅ Swiper Carousel - Sama seperti RelatedProperties */}
                  {!loading && properties.length > 0 && (
                    <Swiper
                      dir="ltr"
                      className="swiper sw-layout style-pagination"
                      spaceBetween={15}
                      breakpoints={{
                        0: { slidesPerView: 1 },
                        575: { slidesPerView: 1 },
                        768: { slidesPerView: 2, spaceBetween: 30 },
                        992: { slidesPerView: 3, spaceBetween: 40 },
                        1200: { slidesPerView: 4, spaceBetween: 40 },
                      }}
                      modules={[Pagination, Navigation]}
                      pagination={{ el: ".spd7", clickable: true }}
                      navigation={{
                        prevEl: ".home-property-prev",
                        nextEl: ".home-property-next",
                      }}
                    >
                      {properties.map((property) => {
                        const added = isInCompare(property.id);
                        const disabled = !added && isFull;
                        const metaItems = getPropertyCardMetaItems(property);

                        return (
                        <SwiperSlide className="swiper-slide" key={property.id}>
                          
                          {/* ✅ Property Card - Sama persis seperti RelatedProperties */}
                          <div className="box-house hover-img">
                            <div className="image-wrap property-card-image-wrap">
                              <Link href={`/properti/${property.slug}`}>
                                <div className="image" style={{ position: "relative", height: "250px" }}>
                                  <Image
                                    src={getImageSrc(property)}
                                    alt={property.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                    style={{ objectFit: "cover" }}
                                  />
                                </div>
                              </Link>
                              
                              {/* Tags */}
                              <ul className="box-tag flex gap-8">
                                {property.listing_type && (
                                  <li className="flat-tag text-4 bg-main fw-6 text_white">
                                    {property.listing_type === "jual" ? "Dijual" : "Disewa"}
                                  </li>
                                )}
                                {property.type && (
                                  <li className="flat-tag text-4 bg-3 fw-6 text_white">
                                    {property.type === "rumah" ? "Rumah" :
                                     property.type === "villa" ? "Villa" :
                                     property.type === "ruko" ? "Ruko" :
                                     property.type === "kos" ? "Kos" :
                                     property.type === "tanah" ? "Tanah" :
                                     property.type}
                                  </li>
                                )}
                              </ul>
                              
                              {/* Action Buttons */}
                              <div className="list-btn flex gap-8">
                                <button
                                  type="button"
                                  className={`btn-icon save hover-tooltip ${added ? "active" : ""}`}
                                  onClick={() => handleCompareProperty(property, added)}
                                  disabled={disabled}
                                  aria-pressed={added}
                                >
                                  <i className="icon-compare" />
                                  <span className="tooltip">
                                    {added
                                      ? "Hapus Komparasi"
                                      : disabled
                                      ? "Maks 3 properti"
                                      : "Komparasi"}
                                  </span>
                                </button>
                                <Link
                                  href={`/properti/${property.slug}`}
                                  className="btn-icon find hover-tooltip"
                                  aria-label={`Lihat detail ${property.title}`}
                                >
                                  <i className="icon-find-plus" />
                                  <span className="tooltip">Lihat Detail</span>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="content">
                              <h5 className="title">
                                <Link href={`/properti/${property.slug}`}>
                                  {property.title}
                                </Link>
                              </h5>
                              <p className="location text-1 flex items-center gap-6">
                                <i className="icon-location" /> {getLocation(property)}
                              </p>
                              <div className="property-card-views mb-12">
                                <PropertyViewMeta views={property.views} />
                              </div>
                              <ul className="meta-list flex">
                                {metaItems.map((item) => (
                                  <li className="text-1 flex" key={item.key}>
                                    <span>
                                      {item.value}
                                      {item.suffix || ""}
                                    </span>
                                    {item.label}
                                  </li>
                                ))}
                              </ul>
                              <div className="bot flex justify-between items-center">
                                <h6 className="price">{formatPriceDisplay(property)}</h6>
                                <div className="wrap-btn flex">
                                  <button
                                    type="button"
                                    className="compare flex gap-8 items-center text-1"
                                    onClick={() => handleCompareProperty(property, added)}
                                    disabled={disabled}
                                    aria-pressed={added}
                                  >
                                    <i className="icon-compare" />
                                    {added ? "Dibandingkan ✓" : "Bandingkan"}
                                  </button>
                                  <Link
                                    href={`/properti/${property.slug}`}
                                    className="tf-btn style-border pd-4"
                                  >
                                    Detail
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                        </SwiperSlide>
                        );
                      })}
                      
                      <div className="sw-wrap-btn home-carousel-nav mt-48">
                        <div className="swiper-button-prev sw-button nav-prev-layout home-property-prev">
                          <i className="icon-arrow-left-3" />
                        </div>
                        <div className="sw-pagination sw-pagination-layout text-center spd7" />
                        <div className="swiper-button-next sw-button nav-next-layout home-property-next">
                          <i className="icon-arrow-right-3" />
                        </div>
                      </div>
                    </Swiper>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
