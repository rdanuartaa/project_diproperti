"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";
import { Pagination } from "swiper/modules";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import "swiper/css";
import "swiper/css/pagination";

const fallbackImage = "/images/section/location-23.jpg";

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

function getBedrooms(property) {
  return property?.detail?.bedrooms ?? property?.beds ?? "-";
}

function getBathrooms(property) {
  return property?.detail?.bathrooms ?? property?.baths ?? "-";
}

function getArea(property) {
  return (
    property?.detail?.luas_bangunan ??
    property?.sqft ??
    property?.detail?.luas_tanah ??
    "-"
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

// ✅ Daftar tipe properti untuk filter tabs (sesuai enum di backend)
const PROPERTY_TYPES = [
  { value: "rumah", label: "Rumah", listings: "10 Listing" },
  { value: "perumahan", label: "Perumahan", listings: "9 Listing" },
  { value: "ruko", label: "Ruko", listings: "10 Listing" },
  { value: "kos", label: "Kos", listings: "20 Listing" },
  { value: "tanah", label: "Tanah", listings: "9 Listing" },
];

export default function Properties() {
  const [activeType, setActiveType] = useState("rumah");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch properties dari API berdasarkan type filter
  useEffect(() => {
    if (!activeType) return;

    let isMounted = true;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const response = await api.get("/properties", {
          params: {
            type: activeType,      // ✅ Filter by type: rumah/perumahan/ruko/kos/tanah
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

  return (
    <section className="section-popular-searches tf-spacing-1">
      <div className="tf-container md">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center mb-48">
              <h2 className="title split-text effect-right">
                <SplitTextAnimation text="Popular Searches" />
              </h2>
              <p className="text-1 split-text split-lines-transform">
                Ribuan pencari properti mewah seperti Anda mengunjungi website kami.
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
                      {item.listings}
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
                        <span className="visually-hidden">Loading...</span>
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
                      modules={[Pagination]}
                      pagination={{ el: ".spd7" }}
                    >
                      {properties.map((property) => (
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
                                    sizes="(max-width: 768px) 100vw, 33vw"
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
                                     property.type === "perumahan" ? "Perumahan" :
                                     property.type === "ruko" ? "Ruko" :
                                     property.type === "kos" ? "Kos" :
                                     property.type === "tanah" ? "Tanah" :
                                     property.type}
                                  </li>
                                )}
                              </ul>
                              
                              {/* Action Buttons */}
                              <div className="list-btn flex gap-8">
                                <a href="#" className="btn-icon save hover-tooltip">
                                  <i className="icon-compare" />
                                  <span className="tooltip">Komparasi</span>
                                </a>
                                <a href="#" className="btn-icon find hover-tooltip">
                                  <i className="icon-find-plus" />
                                  <span className="tooltip">Quick View</span>
                                </a>
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
                              <ul className="meta-list flex">
                                <li className="text-1 flex">
                                  <span>{getBedrooms(property)}</span>Beds
                                </li>
                                <li className="text-1 flex">
                                  <span>{getBathrooms(property)}</span>Baths
                                </li>
                                <li className="text-1 flex">
                                  <span>{getArea(property)}</span>m2
                                </li>
                              </ul>
                              <div className="bot flex justify-between items-center">
                                <h6 className="price">{formatHarga(property.price)}</h6>
                                <div className="wrap-btn flex">
                                  <a href="#" className="compare flex gap-8 items-center text-1">
                                    <i className="icon-compare" />
                                    Compare
                                  </a>
                                  <Link
                                    href={`/properti/${property.slug}`}
                                    className="tf-btn style-border pd-4"
                                  >
                                    Details
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                        </SwiperSlide>
                      ))}
                      
                      <div className="mb-44"></div>
                      <div className="sw-pagination sw-pagination-layout text-center spd7" />
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