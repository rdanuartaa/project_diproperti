"use client";

import Image from "next/image";
import { Gallery, Item } from "react-photoswipe-gallery";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const fallbackImage = "/images/section/location-23.jpg";

export default function Slider1({ slug }) {
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/properties/${slug}`);
        
        if (!isMounted) return;

        const data = response.data?.data || response.data;
        setProperty(data);

        const imgs = Array.isArray(data?.images) 
          ? data.images 
          : data?.images?.data || [];
        
        const sorted = [...imgs].sort(
          (a, b) => Number(b.is_primary || b.isPrimary) - Number(a.is_primary || a.isPrimary)
        );
        
        setImages(sorted);
      } catch (err) {
        if (!isMounted) return;
        
        console.error("Failed to fetch property images:", err);
        setError("Gagal memuat galeri properti.");
        setImages([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="section-property-image">
        <div className="tf-container">
          <div className="wrap-image" style={{ height: "600px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-1 ms-2 mb-0">Memuat galeri...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section className="section-property-image">
        <div className="tf-container">
          <div className="wrap-image">
            <div className="image img-1" style={{ width: "100%", height: "600px", position: "relative" }}>
              <Image
                src={fallbackImage}
                alt="No Image Available"
                fill
                style={{ objectFit: "cover", borderRadius: "16px" }}
              />
            </div>
          </div>
          {error && <p className="text-danger text-center mt-3">{error}</p>}
        </div>
      </section>
    );
  }

  if (!images.length) {
    return (
      <section className="section-property-image">
        <div className="tf-container">
          <div className="wrap-image">
            <div className="image img-1" style={{ width: "100%", height: "600px", position: "relative" }}>
              <Image
                src={property?.image_url || property?.thumbnail || fallbackImage}
                alt={property?.title || "Property"}
                fill
                style={{ objectFit: "cover", borderRadius: "16px" }}
              />
              <div 
                className="position-absolute"
                style={{
                  bottom: "20px",
                  left: "20px",
                  backgroundColor: "#ff9800",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                1/1 Photos
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Ambil 3 gambar untuk ditampilkan (1 utama + 2 thumbnail persegi)
  const mainImage = images[0];
  const thumbnailImages = images.slice(1, 3); // Hanya 2 gambar
  const totalImages = images.length;

  return (
    <section id="gallery-swiper-started" className="section-property-image">
      <div className="tf-container">
        <Gallery>
          <div className="row g-3">
            {/* KOLOM KIRI - Gambar Utama (Persegi Panjang) */}
            <div className="col-lg-8">
              <div 
                className="position-relative" 
                style={{ 
                  borderRadius: "16px", 
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "500px"
                }}
              >
                <Item
                  original={mainImage?.full_url || mainImage?.url || fallbackImage}
                  thumbnail={mainImage?.full_url || mainImage?.url || fallbackImage}
                  width={1200}
                  height={800}
                >
                  {({ ref, open }) => (
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        open();
                      }}
                      className="image-wrap position-relative d-block w-100 h-100"
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ position: "relative", height: "100%", minHeight: "500px" }}>
                        <Image
                          ref={ref}
                          src={mainImage?.full_url || mainImage?.url || fallbackImage}
                          alt={property?.title || "Property"}
                          fill
                          style={{ objectFit: "cover" }}
                          priority
                        />
                      </div>
                      
                      {/* Badge Photos Counter - Orange */}
                      <div 
                        className="position-absolute"
                        style={{
                          bottom: "20px",
                          left: "20px",
                          backgroundColor: "#ff9800",
                          color: "#fff",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          zIndex: 10
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        1/{totalImages} Photos
                      </div>
                    </a>
                  )}
                </Item>
              </div>
            </div>

            {/* KOLOM KANAN - 2 Thumbnail Persegi */}
            <div className="col-lg-4">
              <div className="d-flex flex-column h-100 " style={{ gap: "30px" }}>
                {thumbnailImages.map((img, index) => (
                  <div 
                    key={img?.id || img?.uuid || index}
                    className="position-relative"
                    style={{ 
                      borderRadius: "12px", 
                      overflow: "hidden",
                      flex: 1,
                      aspectRatio: "4/3", // Persegi panjang horizontal
                      minHeight: "200px"
                    }}
                  >
                    <Item
                      original={img?.full_url || img?.url || fallbackImage}
                      thumbnail={img?.full_url || img?.url || fallbackImage}
                      width={800}
                      height={600}
                    >
                      {({ ref, open }) => (
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            open();
                          }}
                          className="image-wrap position-relative d-block w-100 h-100"
                          style={{ cursor: "pointer" }}
                        >
                          <div style={{ position: "relative", width: "100%", height: "100%" }}>
                            <Image
                              ref={ref}
                              src={img?.full_url || img?.url || fallbackImage}
                              alt={`${property?.title || "Property"} - Photo ${index + 2}`}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          
                          {/* Overlay hover effect */}
                          <div 
                            className="position-absolute w-100 h-100"
                            style={{
                              backgroundColor: "rgba(0,0,0,0)",
                              transition: "background-color 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)";
                            }}
                          >
                            <svg 
                              width="40" 
                              height="40" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="white" 
                              strokeWidth="2"
                              style={{ 
                                opacity: 0, 
                                transition: "opacity 0.3s ease",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                borderRadius: "50%",
                                padding: "8px"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = 1;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = 0;
                              }}
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                          </div>
                        </a>
                      )}
                    </Item>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hidden items untuk gallery Photoswipe (gambar ke-4 dan seterusnya) */}
          {images.slice(3).map((img, index) => (
            <Item
              key={img?.id || img?.uuid || index}
              original={img?.full_url || img?.url || fallbackImage}
              thumbnail={img?.full_url || img?.url || fallbackImage}
              width={1200}
              height={800}
            >
              {({ ref, open }) => (
                <a
                  ref={ref}
                  onClick={(e) => {
                    e.preventDefault();
                    open();
                  }}
                  className="d-none"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              )}
            </Item>
          ))}
        </Gallery>
      </div>
    </section>
  );
}