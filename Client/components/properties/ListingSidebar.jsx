"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import DropdownSelect from "../common/DropdownSelect";

export default function ListingSidebar({
  filters,
  onChange,
  onApply,
  onReset,
  loading,
  featuredProperties = [],
  activeFilterCount = 0,
  priceFormatter,
}) {
  return (
    <div className="tf-sidebar sticky-sidebar">
      <form
        className="form-advanced-search mb-30"
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-24">
          <h4 className="heading-title mb-0">Filter Lanjutan</h4>
          <span className="text-2">{activeFilterCount} aktif</span>
        </div>

        {/* ✅ KECAMATAN - Hanya ini yang text input */}
        <fieldset className="mb-20">
          <input
            type="text"
            className="form-control"
            placeholder="Kecamatan"
            value={filters.kecamatan || ""}
            onChange={(e) => onChange("kecamatan", e.target.value)}
          />
        </fieldset>

        {/* ✅ DROPDOWN ADVANCED FILTERS */}
        <div className="group-select mb-24">
          {/* Kamar Tidur */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Jumlah Kamar Tidur", "1", "2", "3", "4", "5+"]}
              selectedValue={filters.bedrooms ? `${filters.bedrooms}` : "Jumlah Kamar Tidur"}
              onChange={(value) =>
                onChange("bedrooms", value === "Jumlah Kamar Tidur" ? "" : value.replace("+", ""))
              }
            />
          </div>

          {/* Kamar Mandi */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Jumlah Kamar Mandi", "1", "2", "3", "4+"]}
              selectedValue={filters.bathrooms ? `${filters.bathrooms}` : "Jumlah Kamar Mandi"}
              onChange={(value) =>
                onChange("bathrooms", value === "Jumlah Kamar Mandi" ? "" : value.replace("+", ""))
              }
            />
          </div>

          {/* Ruang Tamu */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Ruang Tamu", "1", "2", "3+"]}
              selectedValue={filters.living_rooms ? `${filters.living_rooms}` : "Ruang Tamu"}
              onChange={(value) =>
                onChange("living_rooms", value === "Ruang Tamu" ? "" : value.replace("+", ""))
              }
            />
          </div>

          {/* Dapur */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Dapur", "1", "2+"]}
              selectedValue={filters.kitchens ? `${filters.kitchens}` : "Dapur"}
              onChange={(value) =>
                onChange("kitchens", value === "Dapur" ? "" : value.replace("+", ""))
              }
            />
          </div>

          {/* Jumlah Lantai */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Jumlah Lantai", "1", "2", "3", "4+"]}
              selectedValue={filters.floors ? `${filters.floors}` : "Jumlah Lantai"}
              onChange={(value) =>
                onChange("floors", value === "Jumlah Lantai" ? "" : value.replace("+", ""))
              }
            />
          </div>

          {/* Jenis Sertifikat */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Jenis Sertifikat", "SHM", "SHGB"]}
              selectedValue={filters.certificate_type || "Jenis Sertifikat"}
              onChange={(value) =>
                onChange("certificate_type", value === "Jenis Sertifikat" ? "" : value)
              }
            />
          </div>

          {/* Sumber Air */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Sumber Air", "PDAM", "Sumur"]}
              selectedValue={filters.water || "Sumber Air"}
              onChange={(value) =>
                onChange("water", value === "Sumber Air" ? "" : value.toLowerCase())
              }
            />
          </div>

          {/* Jenis Listrik */}
          <div className="box-select mb-20">
            <DropdownSelect
              addtionalParentClass="select-filter"
              options={["Jenis Listrik", "Overground", "Underground"]}
              selectedValue={filters.listrik_type || "Jenis Listrik"}
              onChange={(value) =>
                onChange("listrik_type", value === "Jenis Listrik" ? "" : value.toLowerCase())
              }
            />
          </div>
        </div>

        {/* ✅ HARGA - Slider (jika ingin override dari Hero) */}
        <div className="widget-range mb-24">
          <div className="box-title-price mb-10">
            <div className="caption-price text-12">
              <span>
                Harga: {priceFormatter?.(filters.min_price ? Number(filters.min_price) : 10000000) || "Rp 10 Juta"} - {priceFormatter?.(filters.max_price ? Number(filters.max_price) : 3000000000) || "Rp 3 Miliar"}
              </span>
            </div>
          </div>
          <Slider
            range
            min={10000000}
            max={3000000000}
            step={10000000}
            value={[
              filters.min_price ? Number(filters.min_price) : 10000000,
              filters.max_price ? Number(filters.max_price) : 3000000000
            ]}
            onChange={(values) => {
              onChange("min_price", String(values[0]));
              onChange("max_price", String(values[1]));
            }}
            trackStyle={[{ backgroundColor: "var(--Primary)" }]}
            handleStyle={[
              { borderColor: "var(--Primary)", backgroundColor: "var(--White)" },
              { borderColor: "var(--Primary)", backgroundColor: "var(--White)" }
            ]}
            railStyle={{ backgroundColor: "var(--Line)" }}
          />
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          className="tf-btn style-border w-full mt-20"
          disabled={loading}
        >
          {loading ? "Mencari..." : "Terapkan Filter"}
          <i className="icon-search" />
        </button>

        <button
          type="button"
          className="tf-btn style-border w-full mt-20"
          onClick={onReset}
          disabled={loading}
        >
          Reset Filter
        </button>
      </form>

      {/* FEATURED PROPERTIES */}
      <div className="sidebar-item sidebar-featured style-2 pb-36 mb-28">
        <h4 className="sidebar-title mb-28">Properti Terpopuler</h4>
        <ul>
          {featuredProperties.length > 0 ? (
            featuredProperties.map((property) => (
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
                    <li className="text-1 flex"><span>{property.detail?.bedrooms ?? "-"}</span>Bed</li>
                    <li className="text-1 flex"><span>{property.detail?.bathrooms ?? "-"}</span>Bath</li>
                    <li className="text-1 flex"><span>{property.detail?.luas_bangunan ?? "-"}</span>m²</li>
                  </ul>
                  <div className="price text-1 lh-20 fw-6">
                    {priceFormatter ? priceFormatter(property.price || 0) : property.price}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="text-1">Belum ada properti untuk ditampilkan.</li>
          )}
        </ul>
      </div>
    </div>
  );
}//2