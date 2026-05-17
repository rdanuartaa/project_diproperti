"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { getPropertyConfig } from "@/lib/property";

const CompareContext = createContext(null);
const MAX_COMPARE = 3;

const LISTING_TYPE_LABELS = {
  jual: "Dijual",
  sewa: "Disewa",
};

const normalizeCompareValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getTypeLabel = (type) =>
  getPropertyConfig(type)?.label || String(type || "properti");

const getListingTypeLabel = (listingType) =>
  LISTING_TYPE_LABELS[listingType] || String(listingType || "penawaran");

const getCompareIssue = (property, compareList) => {
  if (!property?.id) {
    return "Data properti belum lengkap untuk ditambahkan ke komparasi.";
  }

  if (compareList.some((p) => p.id === property.id)) return "";

  if (compareList.length >= MAX_COMPARE) {
    return "Maksimal hanya 3 properti yang bisa dibandingkan sekaligus.";
  }

  const reference = compareList[0];
  if (!reference) return "";

  const referenceType = normalizeCompareValue(reference.type);
  const nextType = normalizeCompareValue(property.type);
  if (referenceType && nextType && referenceType !== nextType) {
    return `Komparasi harus memakai tipe properti yang sama. Saat ini bar berisi tipe ${getTypeLabel(reference.type)}, jadi ${getTypeLabel(property.type)} tidak bisa ditambahkan.`;
  }

  const referenceListingType = normalizeCompareValue(reference.listing_type);
  const nextListingType = normalizeCompareValue(property.listing_type);
  if (
    referenceListingType &&
    nextListingType &&
    referenceListingType !== nextListingType
  ) {
    return `Komparasi harus memakai penawaran yang sama. Saat ini bar berisi properti ${getListingTypeLabel(reference.listing_type)}, jadi properti ${getListingTypeLabel(property.listing_type)} tidak bisa ditambahkan.`;
  }

  return "";
};

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);
  const [isBarOpen, setIsBarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [compareNotice, setCompareNotice] = useState({
    open: false,
    message: "",
  });

  const addToCompare = useCallback((property) => {
    const issue = getCompareIssue(property, compareList);
    if (issue) {
      setCompareNotice({ open: true, message: issue });
      if (compareList.length > 0) setIsBarOpen(true);
      return false;
    }

    if (compareList.some((p) => p.id === property.id)) return true;

    setCompareList((prev) => [...prev, property]);
    setIsBarOpen(true);
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback((id) => {
    setCompareList((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setIsBarOpen(false);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    setIsBarOpen(false);
    setIsModalOpen(false);
    setCompareNotice({ open: false, message: "" });
  }, []);

  const isInCompare = useCallback(
    (id) => compareList.some((p) => p.id === id),
    [compareList]
  );

  const getCompareBlockReason = useCallback(
    (property) => getCompareIssue(property, compareList),
    [compareList],
  );

  const isFull = compareList.length >= MAX_COMPARE;
  const compareMeta = compareList[0]
    ? {
        type: compareList[0].type,
        typeLabel: getTypeLabel(compareList[0].type),
        listingType: compareList[0].listing_type,
        listingTypeLabel: getListingTypeLabel(compareList[0].listing_type),
      }
    : null;

  return (
    <CompareContext.Provider
      value={{
        compareList,
        compareMeta,
        isBarOpen,
        setIsBarOpen,
        isModalOpen,
        setIsModalOpen,
        compareNotice,
        setCompareNotice,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        getCompareBlockReason,
        isFull,
        MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare harus dipakai dalam CompareProvider");
  return ctx;
}
