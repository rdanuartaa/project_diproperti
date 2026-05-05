"use client";
import { createContext, useContext, useState, useCallback } from "react";

const CompareContext = createContext(null);
const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);
  const [isBarOpen, setIsBarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addToCompare = useCallback((property) => {
    setCompareList((prev) => {
      if (prev.find((p) => p.id === property.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, property];
    });
    setIsBarOpen(true);
  }, []);

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
  }, []);

  const isInCompare = useCallback(
    (id) => compareList.some((p) => p.id === id),
    [compareList]
  );

  const isFull = compareList.length >= MAX_COMPARE;

  return (
    <CompareContext.Provider
      value={{
        compareList,
        isBarOpen,
        setIsBarOpen,
        isModalOpen,
        setIsModalOpen,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
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