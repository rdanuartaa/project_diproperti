"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import DropdownSelect from "./DropdownSelect";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

export default function SearchForm({ 
  parentClass = "wd-search-form",
  onFilterChange,
  initialFilters = {}
}) {
  const searchFormRef = useRef(null);
  
  // ✅ State untuk price range
  const [priceRange, setPriceRange] = useState(() => {
    if (initialFilters.priceRange && Array.isArray(initialFilters.priceRange)) {
      return initialFilters.priceRange;
    }
    return [10000000, 3000000000];
  });
  
  const [sizeRange, setSizeRange] = useState(() => {
    if (initialFilters.sizeRange && Array.isArray(initialFilters.sizeRange)) {
      return initialFilters.sizeRange;
    }
    return [50, 500];
  });

  // ✅ Dropdown states
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms || "Jumlah Kamar Tidur");
  const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms || "Jumlah Kamar Mandi");
  const [livingRooms, setLivingRooms] = useState(initialFilters.livingRooms || "Ruang Tamu");
  const [kitchens, setKitchens] = useState(initialFilters.kitchens || "Dapur");
  const [floors, setFloors] = useState(initialFilters.floors || "Jumlah Lantai");
  const [certificateType, setCertificateType] = useState(initialFilters.certificateType || "Jenis Sertifikat");
  const [waterSource, setWaterSource] = useState(initialFilters.waterSource || "Sumber Air");
  const [electricityType, setElectricityType] = useState(initialFilters.electricityType || "Jenis Listrik");
  
  // ✅ Checkbox states
  const [amenities, setAmenities] = useState({
    carport: initialFilters.carport || false,
    garden: initialFilters.garden || false,
    oneGateSystem: initialFilters.oneGateSystem || false,
    security24jam: initialFilters.security24jam || false,
    wifiReady: initialFilters.wifiReady || false,
  });

  // ✅ Handler untuk dropdown
  const handleBedroomsChange = useCallback((value) => {
    const numValue = value === "Jumlah Kamar Tidur" ? "" : value.replace("+", "");
    setBedrooms(value);
    if (onFilterChange) onFilterChange("bedrooms", numValue);
  }, [onFilterChange]);

  const handleBathroomsChange = useCallback((value) => {
    const numValue = value === "Jumlah Kamar Mandi" ? "" : value.replace("+", "");
    setBathrooms(value);
    if (onFilterChange) onFilterChange("bathrooms", numValue);
  }, [onFilterChange]);

  const handleLivingRoomsChange = useCallback((value) => {
    const numValue = value === "Ruang Tamu" ? "" : value.replace("+", "");
    setLivingRooms(value);
    if (onFilterChange) onFilterChange("living_rooms", numValue);
  }, [onFilterChange]);

  const handleKitchensChange = useCallback((value) => {
    const numValue = value === "Dapur" ? "" : value.replace("+", "");
    setKitchens(value);
    if (onFilterChange) onFilterChange("kitchens", numValue);
  }, [onFilterChange]);

  const handleFloorsChange = useCallback((value) => {
    const numValue = value === "Jumlah Lantai" ? "" : value.replace("+", "");
    setFloors(value);
    if (onFilterChange) onFilterChange("floors", numValue);
  }, [onFilterChange]);

  const handleCertificateChange = useCallback((value) => {
    const certValue = value === "Jenis Sertifikat" ? "" : value;
    setCertificateType(value);
    if (onFilterChange) onFilterChange("certificate_type", certValue);
  }, [onFilterChange]);

  const handleWaterSourceChange = useCallback((value) => {
    const waterValue = value === "Sumber Air" ? "" : value.toLowerCase();
    setWaterSource(value);
    if (onFilterChange) onFilterChange("water", waterValue);
  }, [onFilterChange]);

  const handleElectricityTypeChange = useCallback((value) => {
    const elecValue = value === "Jenis Listrik" ? "" : value.toLowerCase();
    setElectricityType(value);
    if (onFilterChange) onFilterChange("listrik_type", elecValue);
  }, [onFilterChange]);

  // ✅ FIX: Handler untuk price slider - kirim min_price dan max_price terpisah
  const handlePriceChange = useCallback((values) => {
    setPriceRange(values);
    if (onFilterChange) {
      onFilterChange("min_price", String(values[0]));  // ✅ Kirim sebagai string
      onFilterChange("max_price", String(values[1]));  // ✅ Kirim sebagai string
    }
  }, [onFilterChange]);

  // ✅ Handler untuk size slider
  const handleSizeChange = useCallback((values) => {
    setSizeRange(values);
    if (onFilterChange) {
      onFilterChange("min_size", String(values[0]));
      onFilterChange("max_size", String(values[1]));
    }
  }, [onFilterChange]);

  // ✅ Handler untuk checkbox amenities
  const handleAmenityChange = useCallback((amenityKey, checked) => {
    const newAmenities = { ...amenities, [amenityKey]: checked };
    setAmenities(newAmenities);
    if (onFilterChange) {
      onFilterChange("amenities", newAmenities);
    }
  }, [amenities, onFilterChange]);

  // ✅ Toggle form visibility
  useEffect(() => {
    const searchFormToggler = document.querySelector(".searchFormToggler");

    const handleToggle = () => {
      if (searchFormRef.current) {
        searchFormRef.current.classList.toggle("show");
      }
    };

    if (searchFormToggler) {
      searchFormToggler.addEventListener("click", handleToggle);
    }

    return () => {
      if (searchFormToggler) {
        searchFormToggler.removeEventListener("click", handleToggle);
      }
    };
  }, []);

  // ✅ Format harga
  const formatPrice = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace("Rp", "Rp ");
  };

  // ✅ Memoize slider props
  const priceSliderProps = useMemo(() => ({
    range: true,
    max: 3000000000,
    min: 10000000,
    step: 10000000,
    value: priceRange,
    onChange: handlePriceChange,
    trackStyle: [{ backgroundColor: "var(--Primary)" }],
    handleStyle: [
      { borderColor: "var(--Primary)", backgroundColor: "var(--White)" },
      { borderColor: "var(--Primary)", backgroundColor: "var(--White)" }
    ],
    railStyle: { backgroundColor: "var(--Line)" }
  }), [priceRange, handlePriceChange]);

  const sizeSliderProps = useMemo(() => ({
    range: true,
    max: 1000,
    min: 0,
    step: 10,
    value: sizeRange,
    onChange: handleSizeChange
  }), [sizeRange, handleSizeChange]);

  return (
    <div className={parentClass} ref={searchFormRef}>
      {/* ====== HARGA & UKURAN ====== */}
      <div className="group-price">
        {/* Price Range */}
        <div className="widget-price">
          <div className="box-title-price">
            <span className="title-price">Rentang Harga</span>
            <div className="caption-price">
              <span>dari</span>{" "}
              <span className="value fw-6">{formatPrice(priceRange[0])}</span>{" "}
              <span>sampai</span>
              <span className="value fw-6">{formatPrice(priceRange[1])}</span>
            </div>
          </div>
          <Slider {...priceSliderProps} />
        </div>
        
        {/* Size Range */}
        <div className="widget-price">
          <div className="box-title-price">
            <span className="title-price">Luas Bangunan (m²)</span>
            <div className="caption-price">
              <span>dari</span>{" "}
              <span className="value fw-6">{sizeRange[0]}</span>{" "}
              <span>sampai</span>{" "}
              <span className="value fw-6">{sizeRange[1]}</span>
            </div>
          </div>
          <Slider {...sizeSliderProps} />
        </div>
      </div>

      {/* ====== DROPDOWN FILTERS ====== */}
      <div className="group-select">
        {/* Kamar Tidur */}
        <div className="box-select">
          <DropdownSelect
            options={["Jumlah Kamar Tidur", "1", "2", "3", "4", "5+"]}
            selectedValue={bedrooms}
            onChange={handleBedroomsChange}
            addtionalParentClass=""
          />
        </div>

        {/* Kamar Mandi */}
        <div className="box-select">
          <DropdownSelect
            options={["Jumlah Kamar Mandi", "1", "2", "3", "4+"]}
            selectedValue={bathrooms}
            onChange={handleBathroomsChange}
            addtionalParentClass=""
          />
        </div>

        {/* Ruang Tamu */}
        <div className="box-select">
          <DropdownSelect
            options={["Ruang Tamu", "1", "2", "3+"]}
            selectedValue={livingRooms}
            onChange={handleLivingRoomsChange}
            addtionalParentClass=""
          />
        </div>

        {/* Dapur */}
        <div className="box-select">
          <DropdownSelect
            options={["Dapur", "1", "2+"]}
            selectedValue={kitchens}
            onChange={handleKitchensChange}
            addtionalParentClass=""
          />
        </div>

        {/* Jumlah Lantai */}
        <div className="box-select">
          <DropdownSelect
            options={["Jumlah Lantai", "1", "2", "3", "4+"]}
            selectedValue={floors}
            onChange={handleFloorsChange}
            addtionalParentClass=""
          />
        </div>

        {/* Sertifikat */}
        <div className="box-select">
          <DropdownSelect
            options={["Jenis Sertifikat", "SHM", "SHGB"]}
            selectedValue={certificateType}
            onChange={handleCertificateChange}
            addtionalParentClass=""
          />
        </div>

        {/* Sumber Air */}
        <div className="box-select">
          <DropdownSelect
            options={["Sumber Air", "PDAM", "Sumur"]}
            selectedValue={waterSource}
            onChange={handleWaterSourceChange}
            addtionalParentClass=""
          />
        </div>

        {/* Jenis Listrik */}
        <div className="box-select">
          <DropdownSelect
            options={["Jenis Listrik", "Overground", "Underground"]}
            selectedValue={electricityType}
            onChange={handleElectricityTypeChange}
            addtionalParentClass=""
          />
        </div>
      </div>

      {/* ====== CHECKBOX AMENITIES ====== */}
      <div className="group-checkbox">
        <div className="title text-4 fw-6 mb-16">Fasilitas & Fasilitas:</div>
        <div className="group-amenities">
          <fieldset className="checkbox-item style-1">
            <label>
              <span className="text-4">Carport</span>
              <input 
                type="checkbox" 
                checked={amenities.carport}
                onChange={(e) => handleAmenityChange("carport", e.target.checked)}
              />
              <span className="btn-checkbox" />
            </label>
          </fieldset>

          <fieldset className="checkbox-item style-1 mt-12">
            <label>
              <span className="text-4">Taman</span>
              <input 
                type="checkbox" 
                checked={amenities.garden}
                onChange={(e) => handleAmenityChange("garden", e.target.checked)}
              />
              <span className="btn-checkbox" />
            </label>
          </fieldset>

          <fieldset className="checkbox-item style-1 mt-12">
            <label>
              <span className="text-4">One Gate System</span>
              <input 
                type="checkbox" 
                checked={amenities.oneGateSystem}
                onChange={(e) => handleAmenityChange("oneGateSystem", e.target.checked)}
              />
              <span className="btn-checkbox" />
            </label>
          </fieldset>

          <fieldset className="checkbox-item style-1 mt-12">
            <label>
              <span className="text-4">Keamanan 24 Jam</span>
              <input 
                type="checkbox" 
                checked={amenities.security24jam}
                onChange={(e) => handleAmenityChange("security24jam", e.target.checked)}
              />
              <span className="btn-checkbox" />
            </label>
          </fieldset>

          <fieldset className="checkbox-item style-1 mt-12">
            <label>
              <span className="text-4">WiFi Ready</span>
              <input 
                type="checkbox" 
                checked={amenities.wifiReady}
                onChange={(e) => handleAmenityChange("wifiReady", e.target.checked)}
              />
              <span className="btn-checkbox" />
            </label>
          </fieldset>
        </div>
      </div>
    </div>
  );
}