"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import FaqSidebar from "./sidebar";
import { api } from "@/lib/api";

const TOPIC_LABELS = {
  properti: "Seputar Properti",
  kpr: "KPR & Pembiayaan",
  platform: "Platform DiProperti",
  umum: "Umum",
};

const TOPIC_ORDER = ["umum", "properti", "kpr", "platform"];

export default function Faqs() {
  const [faqsByTopic, setFaqsByTopic] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/faqs", {
          params: { status: "published", per_page: 100 },
        });

        const items = res.data?.data ?? [];

        const grouped = {};
        TOPIC_ORDER.forEach((topic) => {
          const topicItems = items.filter((f) => f.topic === topic);
          if (topicItems.length > 0) {
            grouped[topic] = topicItems;
          }
        });

        setFaqsByTopic(grouped);
      } catch (err) {
        setError("Gagal memuat FAQ. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <section className="section-faq">
      <div className="tf-container">
        <div className="row">
          <div className="col-xl-8 col-lg-7">
            <div className="heading-section mb-48">
              <h2 className="title">Pertanyaan yang Sering Ditanyakan</h2>
            </div>

            {/* Loading */}
            {loading && <div className="text-1 py-5">Memuat FAQ...</div>}

            {/* Error */}
            {!loading && error && (
              <div className="text-1 py-5 text-danger">{error}</div>
            )}

            {/* FAQ */}
            {!loading &&
              !error &&
              Object.entries(faqsByTopic).map(([topic, faqs], topicIndex) => {
                const wrapperId = `wrapper-faq-${topic}`;
                const isLast =
                  topicIndex === Object.keys(faqsByTopic).length - 1;

                return (
                  <div
                    key={topic}
                    className={`tf-faq ${!isLast ? "mb-49" : ""}`}
                  >
                    <h3 className="fw-8 title mb-24">
                      {TOPIC_LABELS[topic] ?? topic}
                    </h3>

                    <ul className="box-faq" id={wrapperId}>
                      {faqs.map((faq, faqIndex) => {
                        const accordionId = `accordion-${topic}-${faq.id}`;
                        const isFirst = faqIndex === 0;

                        return (
                          <li
                            key={faq.id}
                            className={`faq-item ${isFirst ? "active" : ""}`}
                          >
                            <a
                              href={`#${accordionId}`}
                              className={`faq-header h6 ${
                                !isFirst ? "collapsed" : ""
                              }`}
                              data-bs-toggle="collapse"
                              aria-expanded={isFirst ? "true" : "false"}
                              aria-controls={accordionId}
                            >
                              {faq.question}
                              <i className="icon-CaretDown" />
                            </a>

                            <div
                              id={accordionId}
                              className={`collapse ${isFirst ? "show" : ""}`}
                              data-bs-parent={`#${wrapperId}`}
                            >
                              <p className="faq-body">{faq.answer || "-"}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

            {/* Empty */}
            {!loading && !error && Object.keys(faqsByTopic).length === 0 && (
              <div className="text-1 py-5">Belum ada FAQ yang tersedia.</div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-xl-4 col-lg-5">
            <FaqSidebar />
          </div>
        </div>
      </div>
    </section>
  );
}
