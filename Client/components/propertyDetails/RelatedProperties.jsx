"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { api } from "@/lib/api";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const fallbackImage = "/images/section/location-23.jpg";

// ✅ Helper functions (sama persis seperti PropertyGridItems)
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

export default function RelatedProperties({ slug }) {
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRelated = async () => {
      try {
        setLoading(true);

        // STEP 1: Fetch current property untuk dapatkan type/city/id
        const currentRes = await api.get(`/properties/${slug}`);
        const current = currentRes.data?.data || currentRes.data;
        
        if (!isMounted || !current) {
          setLoading(false);
          return;
        }

        const { id: currentId, type, city } = current;

        // STEP 2: Fetch related properties dengan filter
        const params = {
          per_page: 10,
          type: type,
          city: city,
          exclude_id: currentId,
          status: "published",
        };

        const response = await api.get("/properties", { params });
        
        if (!isMounted) return;

        const data = response.data?.data || response.data || [];
        const filtered = data.filter((p) => p.id !== currentId && p.slug !== slug);
        
        setRelatedProperties(filtered.slice(0, 10));
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch related properties:", err);
        setRelatedProperties([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Sembunyikan section jika loading atau tidak ada related properties
  if (loading || relatedProperties.length === 0) {
    return null;
  }

  return (
    <section className="section-similar-properties tf-spacing-3">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section mb-32">
              <h2 className="title">Properti Serupa</h2>
              <p className="text-1 text-color-default">
                Temukan properti lain yang mirip dengan yang Anda lihat
              </p>
            </div>

            {/* Desktop: Swiper dengan styling sama seperti grid */}
            <div className="d-none d-lg-block">
              <Swiper
                modules={[Pagination, Navigation]}
                spaceBetween={15}
                slidesPerView={3}
                pagination={{ clickable: true, el: ".related-pagination" }}
                navigation={{ nextEl: ".related-next", prevEl: ".related-prev" }}
                breakpoints={{
                  992: { slidesPerView: 3 },
                  768: { slidesPerView: 2 },
                  576: { slidesPerView: 1 },
                }}
                className="tf-swiper-related"
              >
                {relatedProperties.map((property) => (
                  <SwiperSlide key={property.id}>
                    {/* ✅ Property Card - sama persis seperti PropertyGridItems */}
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
                              {property.type}
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
              </Swiper>
              
              {/* Navigation & Pagination */}
              <div className="swiper-controls flex justify-end gap-2 mt-4">
                <button className="btn-icon related-prev"><i className="icon-arrow-left" /></button>
                <button className="btn-icon related-next"><i className="icon-arrow-right" /></button>
              </div>
              <div className="related-pagination text-center mt-3" />
            </div>

            {/* Mobile: Simple Grid (tanpa swiper) */}
            <div className="d-lg-none">
              <div className="row g-3">
                {relatedProperties.slice(0, 4).map((property) => (
                  <div key={property.id} className="col-12">
                    {/* ✅ Property Card - sama untuk mobile */}
                    <div className="box-house hover-img">
                      <div className="image-wrap property-card-image-wrap">
                        <Link href={`/properti/${property.slug}`}>
                          <div className="image" style={{ position: "relative", height: "250px" }}>
                            <Image
                              src={getImageSrc(property)}
                              alt={property.title}
                              fill
                              sizes="100vw"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        </Link>
                        
                        <ul className="box-tag flex gap-8">
                          {property.listing_type && (
                            <li className="flat-tag text-4 bg-main fw-6 text_white">
                              {property.listing_type === "jual" ? "Dijual" : "Disewa"}
                            </li>
                          )}
                          {property.type && (
                            <li className="flat-tag text-4 bg-3 fw-6 text_white">
                              {property.type}
                            </li>
                          )}
                        </ul>
                        
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
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}