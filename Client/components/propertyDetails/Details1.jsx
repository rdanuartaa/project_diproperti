"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PropertyOverview from "./PropertyOverview";
import ExtraInfo from "./ExtraInfo";
import Features from "./Features";
import Location from "./Location";
import Sidebar from "./Sidebar";

export default function Details1({ slug }) {
  const [property, setProperty] = useState(null);
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
      } catch (err) {
        if (!isMounted) return;
        
        console.error("Failed to fetch property details:", err);
        setError("Gagal memuat detail properti.");
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
      <section className="section-property-detail">
        <div className="tf-container">
          <div className="py-5 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-1 mt-2">Memuat detail properti...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section className="section-property-detail">
        <div className="tf-container">
          <div className="py-5 text-center text-danger">
            {error || "Properti tidak ditemukan."}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-property-detail">
      <div className="tf-container">
        <div className="row">
          <div className="col-xl-8 col-lg-7">
            <div className="wg-property box-overview">
              <PropertyOverview property={property} />
            </div>
            <div className="wg-property box-property-detail">
              <ExtraInfo property={property} />
            </div>
            <div className="wg-property box-amenities">
              <Features property={property} />
            </div>
            <div className="wg-property single-property-map">
              <Location property={property} />
            </div>
          </div>
          <div className="col-xl-4 col-lg-5">
            <Sidebar property={property} />
          </div>
        </div>
      </div>
    </section>
  );
}