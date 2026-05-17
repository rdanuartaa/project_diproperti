"use client";
import React, { useEffect, useMemo, useState } from "react";
import LayoutHandler from "./LayoutHandler";
import PropertyGridItems from "./PropertyGridItems";
import PropertyListItems from "./PropertyListItems";
import ListingSidebar from "./ListingSidebar";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCompare } from "@/components/compare/CompareContext";
import { getPropertyConfig } from "@/lib/property";

const PAGE_SIZE = 12;

const EMPTY_FILTERS = {
  search: "", city: "", location: "", type: "", listing_type: "",
  min_price: "", max_price: "", kecamatan: "",
  bedrooms: "", bathrooms: "", living_rooms: "",
  kitchens: "", floors: "", certificate_type: "",
  water: "", listrik_type: "", rent_period: "",
  total_rooms: "", bathroom_position: "", gender_type: "",
  parking_capacity: "", warehouse_area: "", shop_front_width: "",
  road_access: "", land_type: "", luas_tanah: "", luas_bangunan: "",
  amenities: {},
};

const PROPERTY_TYPE_OPTIONS = ["Semua Tipe", "rumah", "villa", "ruko", "kos", "tanah"];
const LISTING_TYPE_OPTIONS = ["Jual/Sewa", "Dijual", "Disewa"];
const LISTING_TYPE_LABELS = {
  jual: "Dijual",
  sewa: "Disewa",
};
const SORT_OPTIONS = ["Terbaru", "Terlama", "Terpopuler"];
const TYPE_FILTER_KEYS = {
  rumah: ["bedrooms", "bathrooms", "living_rooms", "kitchens", "floors", "certificate_type", "water", "listrik_type", "luas_tanah", "luas_bangunan"],
  villa: ["bedrooms", "bathrooms", "living_rooms", "kitchens", "floors", "certificate_type", "water", "listrik_type", "luas_tanah", "luas_bangunan"],
  kos: ["total_rooms", "bathrooms", "bathroom_position", "gender_type", "water", "listrik_type"],
  ruko: ["parking_capacity", "warehouse_area", "shop_front_width", "certificate_type", "water", "listrik_type", "road_access", "luas_tanah", "luas_bangunan"],
  tanah: ["certificate_type", "road_access", "land_type", "water", "listrik_type", "luas_tanah"],
};
const TYPE_AMENITIES = {
  rumah: ["carport", "garden", "one_gate_system", "security_24jam"],
  villa: ["swimming_pool", "private_pool", "furnished", "near_tourism"],
  kos: ["wifi_included", "electricity_included", "water_included", "shared_kitchen", "parking_area", "cctv"],
  ruko: [],
  tanah: [],
};
const SHARED_FILTER_KEYS = ["search", "city", "location", "type", "listing_type", "min_price", "max_price", "kecamatan", "rent_period"];

function normalizeFiltersForType(filters, type) {
  const allowedKeys = new Set([...SHARED_FILTER_KEYS, ...(TYPE_FILTER_KEYS[type] || [])]);
  const nextFilters = { ...filters };
  Object.keys(EMPTY_FILTERS).forEach((key) => {
    if (key !== "amenities" && !allowedKeys.has(key)) nextFilters[key] = "";
  });
  const allowedAmenities = new Set(TYPE_AMENITIES[type] || []);
  nextFilters.amenities = Object.fromEntries(
    Object.entries(nextFilters.amenities || {}).filter(([key, value]) => allowedAmenities.has(key) && value),
  );
  return nextFilters;
}

const formatPrice = (value) => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "0";
  const formatUnit = (n) => {
    const rounded = Math.round(n * 10) / 10;
    const text = rounded % 1 === 0 ? String(rounded).replace(/\.0$/, "") : String(rounded);
    return text.replace(".", ",");
  };
  if (num >= 1_000_000_000) return `${formatUnit(num / 1_000_000_000)} milyar`;
  if (num >= 1_000_000) return `${formatUnit(num / 1_000_000)} juta`;
  if (num >= 1_000) return `${formatUnit(num / 1_000)} ribu`;
  return String(num);
};

function buildQueryParams(filters, page) {
  const params = { per_page: PAGE_SIZE, page };
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "amenities" && value && typeof value === "object") {
      const activeAmenities = Object.entries(value)
        .filter(([_, v]) => v === true)
        .map(([k]) => k);
      if (activeAmenities.length > 0) {
        params.amenities = activeAmenities.join(",");
      }
    } else if (value !== "" && value !== null && value !== undefined) {
      params[key] = value;
    }
  });
  return params;
}

function getPageItems(currentPage, lastPage) {
  if (lastPage <= 1) return [1];
  const pages = new Set([1, lastPage, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((a, b) => a - b)
    .flatMap((page, index, array) => {
      const previous = array[index - 1];
      if (previous && page - previous > 1) return ["...", page];
      return [page];
    });
}

export default function Properties3({ defaultGrid = false }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { compareMeta } = useCompare();
  const compareLock =
    compareMeta?.type && compareMeta?.listingType
      ? {
          type: compareMeta.type,
          listing_type: compareMeta.listingType,
          typeLabel: compareMeta.typeLabel || getPropertyConfig(compareMeta.type).label,
          listingTypeLabel:
            compareMeta.listingTypeLabel ||
            LISTING_TYPE_LABELS[compareMeta.listingType] ||
            compareMeta.listingType,
        }
      : null;

  const applyCompareLock = (nextFilters) => {
    if (!compareLock) return nextFilters;
    return normalizeFiltersForType(
      {
        ...nextFilters,
        type: compareLock.type,
        listing_type: compareLock.listing_type,
      },
      compareLock.type,
    );
  };

  const getFiltersFromUrl = () => {
    const filters = { ...EMPTY_FILTERS };
    Object.keys(EMPTY_FILTERS).forEach((key) => {
      if (key === "amenities") {
        const amenitiesStr = searchParams?.get("amenities");
        if (amenitiesStr) {
          filters.amenities = amenitiesStr.split(",").reduce((acc, k) => ({ ...acc, [k]: true }), {});
        }
      } else {
        const val = searchParams?.get(key);
        if (val) filters[key] = val;
      }
    });
    return applyCompareLock(filters);
  };

  const [filters, setFilters] = useState(getFiltersFromUrl);
  const [appliedFilters, setAppliedFilters] = useState(getFiltersFromUrl);
  const [sortOrder, setSortOrder] = useState(() => {
    const value = searchParams?.get("sort_order");
    return value === "asc" || value === "popular" ? value : "desc";
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(() => parseInt(searchParams?.get("page") || "1", 10));
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE, from: 0, to: 0,
  });

  useEffect(() => {
    const newFilters = getFiltersFromUrl();
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    const sortFromUrl = searchParams?.get("sort_order");
    if (sortFromUrl) setSortOrder(sortFromUrl === "asc" || sortFromUrl === "popular" ? sortFromUrl : "desc");
    const pageFromUrl = parseInt(searchParams?.get("page") || "1", 10);
    if (pageFromUrl !== page) setPage(pageFromUrl);
  }, [searchParams, compareMeta]);

  useEffect(() => {
    if (!compareLock) return;

    const lockedFilters = applyCompareLock(appliedFilters);
    const isAlreadyLocked =
      appliedFilters.type === compareLock.type &&
      appliedFilters.listing_type === compareLock.listing_type;

    if (!isAlreadyLocked) {
      setFilters(lockedFilters);
      setAppliedFilters(lockedFilters);
      setPage(1);
    }

    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    const urlListingType = params.get("listing_type");
    if (
      urlType !== compareLock.type ||
      urlListingType !== compareLock.listing_type
    ) {
      params.set("type", compareLock.type);
      params.set("listing_type", compareLock.listing_type);
      params.set("page", "1");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [compareMeta]);

  // ✅ Fetch Properties - HANYA pakai appliedFilters (bukan filters)
  useEffect(() => {
    let isMounted = true;
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/properties", {
          params: buildQueryParams({ ...appliedFilters, sort_order: sortOrder }, page),
        });
        if (!isMounted) return;
        const payload = response.data || {};
        const items = Array.isArray(payload.data) ? payload.data : [];
        setProperties(items);
        setPagination({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          total: payload.total || items.length || 0,
          per_page: payload.per_page || PAGE_SIZE,
          from: payload.from || 0,
          to: payload.to || items.length || 0,
        });
      } catch (fetchError) {
        if (!isMounted) return;
        setProperties([]);
        setPagination({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE, from: 0, to: 0 });
        setError("Data properti gagal dimuat.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProperties();
    return () => { isMounted = false; };
  }, [appliedFilters, page, sortOrder]); // ✅ Depend on appliedFilters

  const featuredProperties = useMemo(() => properties.slice(0, 4), [properties]);
  const pageItems = useMemo(() => getPageItems(pagination.current_page, pagination.last_page), [pagination.current_page, pagination.last_page]);

  const syncUrl = (nextFilters, nextSortOrder = sortOrder) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(nextFilters).forEach(([key, val]) => {
      if (key === "amenities" && val && typeof val === "object") {
        const active = Object.entries(val).filter(([_, v]) => v).map(([k]) => k);
        if (active.length) params.set("amenities", active.join(","));
        else params.delete("amenities");
      } else if (val) {
        params.set(key, String(val));
      } else {
        params.delete(key);
      }
    });
    params.set("sort_order", nextSortOrder);
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const applyFiltersImmediately = (nextFilters, nextSortOrder = sortOrder) => {
    const nextAppliedFilters = applyCompareLock(nextFilters);
    setPage(1);
    setFilters(nextAppliedFilters);
    setAppliedFilters(nextAppliedFilters);
    syncUrl(nextAppliedFilters, nextSortOrder);
  };

  const handleFilterChange = (name, value) => {
    if (compareLock && (name === "type" || name === "listing_type")) return;

    const nextType = name === "type" ? value : filters.type;
    const nextValue =
      name === "price_range" && Array.isArray(value)
        ? { ...filters, min_price: String(value[0]), max_price: String(value[1]) }
        : name === "type" && value === "kos"
        ? { ...filters, type: value, listing_type: "sewa" }
        : name === "type"
        ? { ...filters, type: value }
        : { ...filters, [name]: value };
    const nextFilters = normalizeFiltersForType(nextValue, nextType);
    applyFiltersImmediately(nextFilters);
  };

  const handleSortChange = (value) => {
    const newSort =
      value === "Terlama"
        ? "asc"
        : value === "Terpopuler"
          ? "popular"
          : "desc";
    setSortOrder(newSort);
    applyFiltersImmediately(appliedFilters, newSort);
  };

  const handleResetFilters = () => {
    const resetFilters = applyCompareLock(EMPTY_FILTERS);
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setSortOrder("desc");
    setPage(1);
    if (compareLock) {
      const params = new URLSearchParams();
      params.set("type", compareLock.type);
      params.set("listing_type", compareLock.listing_type);
      params.set("page", "1");
      router.replace(`?${params.toString()}`, { scroll: false });
      return;
    }
    router.replace(window.location.pathname, { scroll: false });
  };

  const startItem = pagination.total === 0 ? 0 : pagination.from || (page - 1) * pagination.per_page + 1;
  const endItem = pagination.to || Math.min(startItem + properties.length - 1, pagination.total);
  const hasResults = properties.length > 0;

  // ✅ Hitung active filter count untuk display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(appliedFilters).forEach(([key, val]) => {
      if (key === "amenities" && val && typeof val === "object") {
        count += Object.values(val).filter(Boolean).length;
      } else if (val && val !== "") {
        count += 1;
      }
    });
    return count;
  }, [appliedFilters]);

  return (
    <section className="flat-title style-2">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="box-title">
              <div><h2>List Daftar Properti</h2></div>
              <div className="right wrap-sort">
                <ul className="nav-tab-filter group-layout" role="tablist">
                  <LayoutHandler defaultGrid={defaultGrid} />
                </ul>
              </div>
            </div>
            {compareLock && (
              <div
                style={{
                  margin: "-10px 0 24px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#eef4ff",
                  color: "var(--Primary, #1a3c6e)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Mode komparasi aktif: listing otomatis difilter ke{" "}
                {compareLock.typeLabel} {compareLock.listingTypeLabel}.
              </div>
            )}
          </div>

          <div className="col-lg-8">
            <div className="flat-animate-tab">
              <div className="tab-content">
                <div className={`tab-pane ${defaultGrid ? " active show" : ""}`} id="gridLayout" role="tabpanel">
                  <div className="tf-grid-layout md-col-2">
                    {loading ? (
                      <div className="w-100 py-5 text-center text-1">Memuat data properti...</div>
                    ) : hasResults ? (
                      <PropertyGridItems properties={properties} />
                    ) : (
                      <div className="w-100 py-5 text-center text-1">{error || "Tidak ada properti yang cocok."}</div>
                    )}
                  </div>
                </div>
                <div className={`tab-pane ${!defaultGrid ? " active show" : ""}`} id="listLayout" role="tabpanel">
                  <div className="wrap-list">
                    {loading ? (
                      <div className="w-100 py-5 text-center text-1">Memuat data properti...</div>
                    ) : hasResults ? (
                      <PropertyListItems properties={properties} />
                    ) : (
                      <div className="w-100 py-5 text-center text-1">{error || "Tidak ada properti yang cocok."}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {pagination.total > 0 && (
              <div className="wrap-pagination">
                <p className="text-1">Showing {startItem}-{endItem} of {pagination.total} results.</p>
                <ul className="wg-pagination">
                  <li className={`arrow ${page <= 1 ? "disabled" : ""}`}>
                    <button type="button" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page <= 1 || loading}><i className="icon-arrow-left" /></button>
                  </li>
                  {pageItems.map((item, index) =>
                    item === "..." ? (
                      <li key={`ellipsis-${index}`}><span>...</span></li>
                    ) : (
                      <li key={item} className={item === page ? "active" : ""}>
                        <button type="button" onClick={() => setPage(item)} disabled={loading}>{item}</button>
                      </li>
                    )
                  )}
                  <li className={`arrow ${page >= pagination.last_page ? "disabled" : ""}`}>
                    <button type="button" onClick={() => setPage((c) => Math.min(pagination.last_page, c + 1))} disabled={page >= pagination.last_page || loading}><i className="icon-arrow-right" /></button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <ListingSidebar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              propertyTypeOptions={PROPERTY_TYPE_OPTIONS}
              listingTypeOptions={LISTING_TYPE_OPTIONS}
              sortOptions={SORT_OPTIONS}
              mainFilterLocked={Boolean(compareLock)}
              loading={loading}
              featuredProperties={featuredProperties}
              activeFilterCount={activeFilterCount}
              priceFormatter={formatPrice}
            />
          </div>
        </div>
      </div>
    </section>
  );
}//1
