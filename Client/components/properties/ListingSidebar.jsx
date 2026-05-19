"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Slider from "rc-slider";
import DropdownSelect from "../common/DropdownSelect";
import { getPropertyCardMetaItems } from "@/lib/property";

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
    { key: "parking_capacity", label: "Parkir", suffix: " mobil" },
    { key: "warehouse_area", label: "WA", suffix: "m²" },
    { key: "building_type", label: "m²" },
  ],
  tanah: [
    { key: "zoning", label: "Fungsi" },
    { key: "road_access", label: "Akses" },
    { key: "luas_tanah", label: "LT", suffix: "m²" },
  ],
};

const ADVANCED_FILTER_CONFIG = {
  default: [],
  rumah: [
    { key: "bedrooms", label: "Jumlah Kamar Tidur", options: ["1", "2", "3", "4", "5+"], numeric: true },
    { key: "bathrooms", label: "Jumlah Kamar Mandi", options: ["1", "2", "3", "4+"], numeric: true },
    { key: "living_rooms", label: "Ruang Tamu", options: ["1", "2", "3+"], numeric: true },
    { key: "kitchens", label: "Dapur", options: ["1", "2+"], numeric: true },
    { key: "floors", label: "Jumlah Lantai", options: ["1", "2", "3", "4+"], numeric: true },
    { key: "certificate_type", label: "Jenis Sertifikat", options: ["SHM", "SHGB"] },
    { key: "water", label: "Sumber Air", options: ["PDAM", "Sumur"], mapValue: (value) => value.toLowerCase() },
    { key: "listrik_type", label: "Jenis Listrik", options: ["Overground", "Underground"], mapValue: (value) => value.toLowerCase() },
    { key: "amenities", amenity: "carport", label: "Carport", options: ["Ya"] },
    { key: "amenities", amenity: "garden", label: "Taman", options: ["Ya"] },
    { key: "amenities", amenity: "one_gate_system", label: "One Gate System", options: ["Ya"] },
    { key: "amenities", amenity: "security_24jam", label: "Keamanan 24 Jam", options: ["Ya"] },
  ],
  villa: [
    { key: "bedrooms", label: "Jumlah Kamar Tidur", options: ["1", "2", "3", "4", "5+"], numeric: true },
    { key: "bathrooms", label: "Jumlah Kamar Mandi", options: ["1", "2", "3", "4+"], numeric: true },
    { key: "living_rooms", label: "Ruang Tamu", options: ["1", "2", "3+"], numeric: true },
    { key: "kitchens", label: "Dapur", options: ["1", "2+"], numeric: true },
    { key: "floors", label: "Jumlah Lantai", options: ["1", "2", "3", "4+"], numeric: true },
    { key: "certificate_type", label: "Jenis Sertifikat", options: ["SHM", "SHGB"] },
    { key: "water", label: "Sumber Air", options: ["PDAM", "Sumur"], mapValue: (value) => value.toLowerCase() },
    { key: "listrik_type", label: "Jenis Listrik", options: ["Overground", "Underground"], mapValue: (value) => value.toLowerCase() },
    { key: "amenities", amenity: "swimming_pool", label: "Kolam Renang", options: ["Ya"] },
    { key: "amenities", amenity: "private_pool", label: "Private Pool", options: ["Ya"] },
    { key: "amenities", amenity: "furnished", label: "Furnished", options: ["Ya"] },
    { key: "amenities", amenity: "near_tourism", label: "Dekat Wisata", options: ["Ya"] },
  ],
  kos: [
    { key: "total_rooms", label: "Total Kamar", options: ["1", "2", "3", "4", "5", "10+"], numeric: true },
    { key: "bathrooms", label: "Jumlah Kamar Mandi", options: ["1", "2", "3", "4+"], numeric: true },
    { key: "bathroom_position", label: "Posisi Kamar Mandi", options: ["Dalam", "Luar"], mapValue: (value) => value.toLowerCase() },
    { key: "gender_type", label: "Tipe Penghuni", options: ["Laki-laki", "Perempuan", "Campuran"], mapValue: (value) => value.toLowerCase() },
    { key: "water", label: "Sumber Air", options: ["PDAM", "Sumur"], mapValue: (value) => value.toLowerCase() },
    { key: "listrik_type", label: "Jenis Listrik", options: ["Overground", "Underground"], mapValue: (value) => value.toLowerCase() },
    { key: "amenities", amenity: "wifi_included", label: "WiFi Termasuk", options: ["Ya"] },
    { key: "amenities", amenity: "electricity_included", label: "Listrik Termasuk", options: ["Ya"] },
    { key: "amenities", amenity: "water_included", label: "Air Termasuk", options: ["Ya"] },
    { key: "amenities", amenity: "shared_kitchen", label: "Dapur Bersama", options: ["Ya"] },
    { key: "amenities", amenity: "parking_area", label: "Area Parkir", options: ["Ya"] },
    { key: "amenities", amenity: "cctv", label: "CCTV", options: ["Ya"] },
  ],
  ruko: [
    { key: "parking_capacity", label: "Kapasitas Parkir (mobil)", options: ["1", "2", "3", "4", "5+"], numeric: true },
    { key: "warehouse_area", label: "Luas Gudang", options: ["10", "25", "50", "100+"], numeric: true },
    { key: "shop_front_width", label: "Lebar Depan Toko", options: ["3", "5", "8", "10+"], numeric: true },
    { key: "certificate_type", label: "Jenis Sertifikat", options: ["SHM", "SHGB"] },
    { key: "road_access", label: "Akses Jalan", options: ["Aspal", "Cor", "Batu", "Belum"], mapValue: (value) => value.toLowerCase() },
    { key: "water", label: "Sumber Air", options: ["PDAM", "Sumur"], mapValue: (value) => value.toLowerCase() },
    { key: "listrik_type", label: "Jenis Listrik", options: ["Overground", "Underground"], mapValue: (value) => value.toLowerCase() },
  ],
  tanah: [
    { key: "certificate_type", label: "Jenis Sertifikat", options: ["SHM", "SHGB"] },
    { key: "road_access", label: "Akses Jalan", options: ["Aspal", "Cor", "Batu", "Belum"], mapValue: (value) => value.toLowerCase() },
    { key: "land_type", label: "Jenis Tanah", options: ["Datar", "Miring", "Bukit"], mapValue: (value) => value.toLowerCase() },
    { key: "water", label: "Sumber Air", options: ["PDAM", "Sumur"], mapValue: (value) => value.toLowerCase() },
    { key: "listrik_type", label: "Jenis Listrik", options: ["Overground", "Underground"], mapValue: (value) => value.toLowerCase() },
  ],
};

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

export default function ListingSidebar({
  filters,
  onChange,
  onReset,
  sortOrder = "desc",
  onSortChange,
  propertyTypeOptions = ["Semua Tipe", "rumah", "villa", "ruko", "kos", "tanah"],
  listingTypeOptions = ["Jual/Sewa", "Dijual", "Disewa"],
  sortOptions = ["Terbaru", "Terlama", "Terpopuler"],
  mainFilterLocked = false,
  loading,
  featuredProperties = [],
  activeFilterCount = 0,
  priceFormatter,
  showFilter = true,
  showFeatured = true,
}) {
  const getRentPeriodLabel = (item) => {
    const period = String(item?.price_period || "bulan");
    if (period === "3bulan") return "3 bulan";
    if (period === "6bulan") return "6 bulan";
    if (period === "tahun") return "tahun";
    return "bulan";
  };

  const formatPriceDisplay = (item) => {
    const base = priceFormatter ? priceFormatter(item?.price || 0) : item?.price;
    if (item?.listing_type !== "sewa") return base;
    if (!item?.price) return base;
    return `${base}/${getRentPeriodLabel(item)}`;
  };

  const activeAdvancedConfig =
    ADVANCED_FILTER_CONFIG[filters.type] || ADVANCED_FILTER_CONFIG.default;

  const selectedListingType =
    filters.listing_type === "jual"
      ? "Dijual"
      : filters.listing_type === "sewa"
      ? "Disewa"
      : "Jual/Sewa";

  const selectedSort =
    sortOrder === "asc"
      ? "Terlama"
      : sortOrder === "popular"
      ? "Terpopuler"
      : "Terbaru";

  const handleTypeChange = (value) => {
    onChange("type", value === "Semua Tipe" ? "" : value);
  };

  const handleListingTypeChange = (value) => {
    const nextValue =
      value === "Dijual" ? "jual" : value === "Disewa" ? "sewa" : "";
    onChange("listing_type", nextValue);
  };

  const getDropdownValue = (field) => {
    if (field.key === "amenities") {
      return filters.amenities?.[field.amenity] ? "Ya" : field.label;
    }
    const rawValue = filters[field.key];
    if (!rawValue) return field.label;
    const matchedOption = field.options.find((option) => {
      const optionValue = field.mapValue ? field.mapValue(option) : option;
      return String(optionValue).replace("+", "") === String(rawValue);
    });
    return matchedOption || String(rawValue);
  };

  const handleAdvancedDropdownChange = (field, value) => {
    if (value === field.label) {
      if (field.key === "amenities") {
        onChange("amenities", { ...(filters.amenities || {}), [field.amenity]: false });
      } else {
        onChange(field.key, "");
      }
      return;
    }

    if (field.key === "amenities") {
      onChange("amenities", { ...(filters.amenities || {}), [field.amenity]: value === "Ya" });
      return;
    }

    const mappedValue = field.mapValue ? field.mapValue(value) : value;
    onChange(field.key, field.numeric ? String(mappedValue).replace("+", "") : mappedValue);
  };

  return (
    <div className="tf-sidebar sticky-sidebar">
      {showFilter && (
      <form
        className="form-advanced-search mb-30"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-24">
          <h4 className="heading-title mb-0">Filter Utama</h4>
          <span className="text-2">{activeFilterCount} aktif</span>
        </div>

        <div className="group-select mb-24">
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={propertyTypeOptions}
              selectedValue={filters.type || "Semua Tipe"}
              onChange={handleTypeChange}
              disabled={mainFilterLocked}
            />
            <p className="text-2 mb-0" style={{ marginTop: "8px" }}>Pilih tipe properti yang dicari.</p>
          </div>
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={listingTypeOptions}
              selectedValue={selectedListingType}
              onChange={handleListingTypeChange}
              disabled={mainFilterLocked}
            />
            <p className="text-2 mb-0" style={{ marginTop: "8px" }}>Pilih status jual atau sewa.</p>
          </div>
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={sortOptions}
              selectedValue={selectedSort}
              onChange={onSortChange}
            />
            <p className="text-2 mb-0" style={{ marginTop: "8px" }}>Atur urutan hasil properti.</p>
          </div>
        </div>

        <fieldset className="mb-20">
          <input
            type="text"
            className="form-control"
            placeholder="Lokasi"
            value={filters.location || ""}
            onChange={(e) => onChange("location", e.target.value)}
          />
          <p className="text-2 mb-0" style={{ marginTop: "8px" }}>Isi kecamatan atau kota.</p>
        </fieldset>

        <div className="widget-range mb-24">
          <div className="box-title-price mb-10">
            <div className="caption-price text-12">
              <span>
                Harga: {priceFormatter?.(filters.min_price ? Number(filters.min_price) : 10000000) || "Rp 10 Juta"} - {priceFormatter?.(filters.max_price ? Number(filters.max_price) : 10000000000) || "Rp 10 Miliar"}
              </span>
            </div>
          </div>
          <Slider
            range
            min={10000000}
            max={10000000000}
            step={10000000}
            value={[
              filters.min_price ? Number(filters.min_price) : 10000000,
              filters.max_price ? Number(filters.max_price) : 10000000000
            ]}
            onChange={(values) => {
              onChange("price_range", values);
            }}
            trackStyle={[{ backgroundColor: "var(--Primary)" }]}
            handleStyle={[
              { borderColor: "var(--Primary)", backgroundColor: "var(--White)" },
              { borderColor: "var(--Primary)", backgroundColor: "var(--White)" }
            ]}
            railStyle={{ backgroundColor: "var(--Line)" }}
          />
        </div>

        {(activeAdvancedConfig.length > 0 || filters.listing_type === "sewa") && (
          <>
            <div className="d-flex align-items-center justify-content-between mb-20 mt-28">
              <h4 className="heading-title mb-0">Filter Lanjutan</h4>
            </div>

            <div className="group-select mb-24">
              {activeAdvancedConfig.map((field) => (
                <div className="box-select mb-20" key={`${field.key}-${field.amenity || field.label}`}>
                  <DropdownSelect
                    addtionalParentClass="select-filter"
                    options={[field.label, ...field.options]}
                    selectedValue={getDropdownValue(field)}
                    onChange={(value) => handleAdvancedDropdownChange(field, value)}
                  />
                </div>
              ))}

              {filters.listing_type === "sewa" && (
                <div className="box-select mb-20">
                  <DropdownSelect
                    addtionalParentClass="select-filter"
                    options={["Periode Sewa", "Bulan", "3 Bulan", "6 Bulan", "Tahun"]}
                    selectedValue={
                      filters.rent_period === "3bulan"
                        ? "3 Bulan"
                        : filters.rent_period === "6bulan"
                        ? "6 Bulan"
                        : filters.rent_period === "tahun" || filters.rent_period === "12bulan"
                        ? "Tahun"
                        : filters.rent_period === "bulan"
                        ? "Bulan"
                        : "Periode Sewa"
                    }
                    onChange={(value) => {
                      const periodValue = value === "Periode Sewa"
                        ? ""
                        : value === "3 Bulan"
                        ? "3bulan"
                        : value === "6 Bulan"
                        ? "6bulan"
                        : value === "Tahun"
                        ? "tahun"
                        : "bulan";
                      onChange("rent_period", periodValue);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          className="tf-btn style-border w-full"
          onClick={onReset}
          disabled={loading}
        >
          Reset Filter
        </button>
      </form>
      )}

      {/* FEATURED PROPERTIES */}
      {showFeatured && (
      <div className="sidebar-item sidebar-featured style-2 pb-36 mb-28">
        <h4 className="sidebar-title mb-28">Properti Terpopuler</h4>
        <ul>
          {featuredProperties.length > 0 ? (
            featuredProperties.map((property) => {
              const metaItems = getPropertyCardMetaItems(property);

              return (
              <li key={property.id} className="box-listings style-2 hover-img">
                <div className="image-wrap">
                  <Image
                    alt={property.title || "Featured property"}
                    width={230}
                    height={160}
                    src={property.images?.[0]?.full_url || "/images/section/location-24.jpg"}
                  />
                </div>
                <div className="content">
                  <div className="text-1 title fw-5 lh-20">
                    <Link href={`/properti/${property.slug}`}>{property.title}</Link>
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
                  <div className="price text-1 lh-20 fw-6">
                    {formatPriceDisplay(property)}
                  </div>
                </div>
              </li>
              );
            })
          ) : (
            <li className="text-1">Belum ada properti untuk ditampilkan.</li>
          )}
        </ul>
      </div>
      )}
    </div>
  );
}//2
