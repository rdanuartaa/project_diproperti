"use client";
import DropdownSelect from "@/components/common/DropdownSelect";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PROPERTY_TYPE_OPTIONS = ["Semua Tipe", "rumah", "villa", "ruko", "kos", "tanah"];
const LISTING_TYPE_OPTIONS = ["Jual/Sewa", "Dijual", "Disewa"];
const SORT_OPTIONS = ["Terbaru", "Terlama", "Terpopuler"];

export default function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertyType, setPropertyType] = useState("Semua Tipe");
  const [listingType, setListingType] = useState("Jual/Sewa");
  const [sortOrder, setSortOrder] = useState("Terbaru");

  useEffect(() => {
    const type = searchParams?.get("type");
    const listingTypeParam = searchParams?.get("listing_type");
    const sortParam = searchParams?.get("sort_order") ?? searchParams?.get("sort");

    if (type) setPropertyType(type);

    if (listingTypeParam === "jual") {
      setListingType("Dijual");
    } else if (listingTypeParam === "sewa") {
      setListingType("Disewa");
    } else {
      setListingType("Jual/Sewa");
    }

    if (sortParam === "asc") {
      setSortOrder("Terlama");
    } else if (sortParam === "popular" || sortParam === "populer") {
      setSortOrder("Terpopuler");
    } else {
      setSortOrder("Terbaru");
    }
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (propertyType && propertyType !== "Semua Tipe") {
      params.set("type", propertyType);
    }

    if (listingType === "Dijual") {
      params.set("listing_type", "jual");
    } else if (listingType === "Disewa") {
      params.set("listing_type", "sewa");
    }

    if (sortOrder === "Terlama") {
      params.set("sort_order", "asc");
    } else if (sortOrder === "Terpopuler") {
      params.set("sort_order", "popular");
    } else {
      params.set("sort_order", "desc");
    }

    params.set("status", "published");

    router.push(`/list-properti?${params.toString()}`);
  };

  return (
    <div
      className="page-title home02"
      style={{ position: "relative", minHeight: "660px" }}
    >
      <Image
        src="/images/diproperti/homehero.jpg"
        alt="Hero Properti"
        fill
        sizes="100vw"
        priority
        style={{ objectFit: "cover", zIndex: 0 }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 1,
        }}
      />
      <div className="tf-container" style={{ position: "relative", zIndex: 2 }}>
        <div className="row">
          <div className="col-12">
            <div className="content-inner">
              <div className="heading-title hero-heading-title">
                <h1 className="title">
                  Jual & Beli Properti Impian <br />
                  <span className="text-color-primary">Lebih Mudah</span> di
                  DiProperti
                </h1>
                <p className="h6 fw-4">
                  Ribuan properti terpercaya siap menanti — temukan rumah, ruko,
                  kos, dan tanah terbaik untuk Anda.
                </p>
              </div>
              <div className="widget-tabs style-1">
                <div className="wg-filter style-2">
                  <div className="widget-content-inner active">
                    <div
                      className="form-title style-2 hero-search-bar"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        maxWidth: "1280px",
                        padding: "16px",
                        background: "#fff",
                        borderRadius: "16px",
                        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
                      }}
                    >
                      <div className="box-select style-2 hero-search-field">
                        <DropdownSelect
                          options={PROPERTY_TYPE_OPTIONS}
                          selectedValue={propertyType}
                          onChange={setPropertyType}
                          addtionalParentClass="select-filter list-sort hero-search-select"
                        />
                      </div>

                      <div className="box-select style-2 hero-search-field">
                        <DropdownSelect
                          options={LISTING_TYPE_OPTIONS}
                          selectedValue={listingType}
                          onChange={setListingType}
                          addtionalParentClass="select-filter list-sort hero-search-select"
                        />
                      </div>

                      <div className="box-select style-2 hero-search-field">
                        <DropdownSelect
                          options={SORT_OPTIONS}
                          selectedValue={sortOrder}
                          onChange={setSortOrder}
                          addtionalParentClass="select-filter list-sort hero-search-select"
                        />
                      </div>

                      <div className="wrap-btn hero-search-action">
                        <button
                          type="button"
                          className="tf-btn bg-color-primary pd-3 hero-search-button"
                          onClick={handleSearch}
                        >
                          Cari <i className="icon-MagnifyingGlass fw-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <style jsx global>{`
                .page-title.home02 .hero-search-bar {
                  min-height: 84px;
                }

                .page-title.home02 .hero-heading-title {
                  margin-top: 55px;
                }

                .page-title.home02 .hero-search-field {
                  flex: 1 1 0;
                  min-width: 0;
                }

                .page-title.home02 .hero-search-select {
                  width: 100% !important;
                  height: 54px;
                  min-height: 54px;
                  display: flex;
                  align-items: center;
                  border: 1px solid #e5e7eb;
                  border-radius: 14px;
                  padding: 0 44px 0 16px;
                  background: #fff;
                }

                .page-title.home02 .hero-search-select .current {
                  width: 100%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .page-title.home02 .hero-search-action {
                  flex: 0 0 146px;
                }

                .page-title.home02 .hero-search-button {
                  width: 100%;
                  height: 54px;
                  border-radius: 16px;
                  justify-content: center;
                  gap: 8px;
                }

                @media (max-width: 767px) {
                  .page-title.home02 {
                    min-height: 620px !important;
                  }

                  .page-title.home02 .hero-search-bar {
                    flex-direction: column;
                    align-items: stretch;
                    min-height: auto;
                    padding: 14px;
                    border-radius: 14px;
                  }

                  .page-title.home02 .hero-search-action,
                  .page-title.home02 .hero-search-field {
                    flex: 1 1 auto;
                    width: 100%;
                  }

                  .page-title.home02 .hero-heading-title {
                    margin-top: 86px;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} //3
