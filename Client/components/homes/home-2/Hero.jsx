"use client";
import DropdownSelect from "@/components/common/DropdownSelect";
import SearchForm from "@/components/common/SearchForm";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFormRef = useRef(null);

  const [activeItem, setActiveItem] = useState("Dijual");
  const [propertyType, setPropertyType] = useState("Tipe Properti");
  const [location, setLocation] = useState("Kota");
  const [searchQuery, setSearchQuery] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [priceRange, setPriceRange] = useState([10000000, 3000000000]);

  const [propertyTypes, setPropertyTypes] = useState(["Tipe Properti"]);
  const [cities, setCities] = useState(["Kota"]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  const items = ["Dijual", "Disewa"];

  // ✅ Load filter options dari API + sync dengan URL params
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const res = await api.get("/properties", {
          params: { per_page: 100, status: "published" },
        });
        const items = res.data?.data ?? [];

        const uniqueTypes = [
          ...new Set(items.map((p) => p.type).filter(Boolean)),
        ];
        setPropertyTypes(["Tipe Properti", ...uniqueTypes]);

        const uniqueCities = [
          ...new Set(items.map((p) => p.city).filter(Boolean)),
        ];
        setCities(["Kota", ...uniqueCities]);
      } catch (err) {
        setPropertyTypes(["Tipe Properti", "rumah", "ruko", "kos", "tanah"]);
        setCities(["Kota", "Jember", "Surabaya", "Malang", "Jakarta"]);
      } finally {
        setLoadingTypes(false);
        setLoadingCities(false);
      }
    };

    fetchFiltersData();

    // ✅ Sync state dengan URL params
    const type = searchParams?.get("type");
    const city = searchParams?.get("city");
    const listingType = searchParams?.get("listing_type");
    const search = searchParams?.get("search");
    const minPrice = searchParams?.get("min_price");
    const maxPrice = searchParams?.get("max_price");

    if (type && type !== "Tipe Properti") setPropertyType(type);
    if (city && city !== "Kota") setLocation(city);
    if (listingType)
      setActiveItem(listingType === "jual" ? "Dijual" : "Disewa");
    if (search) setSearchQuery(search);

    // ✅ Update priceRange dari URL
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? parseInt(minPrice) : 10000000,
        maxPrice ? parseInt(maxPrice) : 3000000000,
      ]);
    }
  }, [searchParams]);

  // ✅ Fungsi utama: Kumpulkan semua filter & redirect ke list-properti
  const handleSearch = () => {
    const params = new URLSearchParams();

    // 1. Listing type (wajib)
    params.set("listing_type", activeItem === "Dijual" ? "jual" : "sewa");

    // 2. Property type
    if (propertyType && propertyType !== "Tipe Properti") {
      params.set("type", propertyType);
    }

    // 3. City
    if (location && location !== "Kota") {
      params.set("city", location);
    }

    // 4. Search query
    if (searchQuery && searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    // 5. Kecamatan
    if (kecamatan && kecamatan.trim()) {
      params.set("kecamatan", kecamatan.trim());
    }

    // 6. ✅ Price range - FIX: Kirim min_price dan max_price
    if (priceRange[0] && priceRange[0] > 0) {
      params.set("min_price", priceRange[0].toString());
    }
    if (priceRange[1] && priceRange[1] > 0) {
      params.set("max_price", priceRange[1].toString());
    }

    // 7. Status
    params.set("status", "published");

    // ✅ Redirect dengan semua filter
    router.push(`/list-properti?${params.toString()}`);
  };

  // ✅ Handler untuk SearchForm - FIX: Handle min_price dan max_price
  const handleSearchFormChange = (key, value) => {
    if (key === "search") setSearchQuery(value);
    if (key === "kecamatan") setKecamatan(value);
    if (key === "min_price") {
      setPriceRange([parseInt(value) || 0, priceRange[1]]);
    }
    if (key === "max_price") {
      setPriceRange([priceRange[0], parseInt(value) || 3000000000]);
    }
    if (key === "bedrooms") {
      // Optional: handle other filters if needed
    }
  };

  return (
    <div
      className="page-title home02"
      style={{ position: "relative", minHeight: "600px" }}
    >
      <Image
        src="/images/diproperti/homehero.jpg"
        alt="Hero Properti"
        fill
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
              <div className="heading-title">
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
                <ul className="widget-menu-tab">
                  {items.map((item) => (
                    <li
                      key={item}
                      className={`item-title ${activeItem === item ? "active" : ""}`}
                      onClick={() => setActiveItem(item)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="wg-filter">
                  <div className="widget-content-inner active">
                    <div className="form-title">
                      <DropdownSelect
                        options={loadingTypes ? ["Memuat..."] : propertyTypes}
                        selectedValue={propertyType}
                        onChange={(val) => setPropertyType(val)}
                        addtionalParentClass=""
                      />

                      <DropdownSelect
                        options={loadingCities ? ["Memuat..."] : cities}
                        selectedValue={location}
                        onChange={(val) => setLocation(val)}
                        addtionalParentClass=""
                      />

                      <div className="wrap-btn">
                        <div className="btn-filter show-form searchFormToggler">
                          <div className="icons">
                            <svg
                              width={24}
                              height={24}
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M21 4H14"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10 4H3"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M21 12H12"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 12H3"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M21 20H16"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 20H3"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 2V6"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 10V14"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M16 18V22"
                                stroke="#F1913D"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="tf-btn bg-color-primary pd-3"
                          onClick={handleSearch}
                        >
                          Cari <i className="icon-MagnifyingGlass fw-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SearchForm dengan callback yang sudah diperbaiki */}
                  <SearchForm
                    ref={searchFormRef}
                    onFilterChange={handleSearchFormChange}
                    initialFilters={{
                      search: searchQuery,
                      kecamatan,
                      priceRange,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} //3
