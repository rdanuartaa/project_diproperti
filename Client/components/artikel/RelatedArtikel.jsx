"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { api } from "@/lib/api";
import ArticleViewMeta from "./ArticleViewMeta";
import "swiper/css";
import "swiper/css/pagination";

export default function RelatedArtikel({ currentSlug }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizeArticles = (payload) =>
      Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    const fetchRelatedArticles = async () => {
      try {
        setLoading(true);

        if (!currentSlug) {
          setArticles([]);
          return;
        }

        const articleRes = await api.get(`/articles/${currentSlug}`);
        const currentArticle = articleRes.data;
        const tagSlugs = (currentArticle?.tags || [])
          .map((tag) => tag.slug)
          .filter(Boolean);

        if (tagSlugs.length === 0) {
          setArticles([]);
          return;
        }

        const relatedResponses = await Promise.all(
          tagSlugs.map((tag) =>
            api.get("/articles", {
              params: {
                page: 1,
                per_page: 7,
                tag,
              },
            })
          )
        );

        const uniqueArticles = new Map();
        relatedResponses
          .flatMap((response) => normalizeArticles(response.data))
          .filter((article) => article.slug !== currentSlug)
          .forEach((article) => uniqueArticles.set(article.id || article.slug, article));

        setArticles(Array.from(uniqueArticles.values()).slice(0, 6));
      } catch (error) {
        console.error("Gagal ambil related articles:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedArticles();
  }, [currentSlug]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="section-related-posts">
        <div className="tf-container">
          <div className="row">
            <div className="col-12">
              <h4 className="heading">Artikel Serupa</h4>
              <div className="text-center py-5">Memuat Artikel...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null; // Sembunyikan section jika tidak ada artikel
  }

  return (
    <section className="section-related-posts">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <h4 className="heading">Artikel Serupa</h4>
            <Swiper
              dir="ltr"
              className="swiper style-pagination sw-layout"
              breakpoints={{
                0: { slidesPerView: 1 },
                575: { slidesPerView: 2 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                992: { slidesPerView: 3, spaceBetween: 40 },
              }}
              modules={[Pagination]}
              pagination={{ el: ".spd1" }}
            >
              {articles.map((article) => (
                <SwiperSlide className="swiper-slide" key={article.id}>
                  <div className="blog-article-item style-2 hover-img">
                    <div className="image-wrap">
                      <Link href={`/artikel/${article.slug}`}>
                        <Image
                          className="lazyload"
                          alt={article.title || "Gambar artikel"}
                          src={article.image_url || "/images/default.jpg"}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw"
                        />
                      </Link>
                      <div className="box-tag">
                        <div className="tag-item text-4 text_white fw-6">
                          {article.tags?.[0]?.name || "Artikel"}
                        </div>
                      </div>
                    </div>
                    <div className="article-content">
                      <div className="time">
                        <ArticleViewMeta views={article.views} compact />
                        <div className="icons" style={{ marginLeft: "8px" }}>
                          <i className="icon-clock" />
                        </div>
                        {/* Format tanggal sesuai API */}
                        <p className="fw-5">{formatDate(article.created_at)}</p>
                      </div>
                      <h4 className="title">
                        <Link
                          href={`/artikel/${article.slug}`}
                          className="line-clamp-2"
                        >
                          {article.title}
                        </Link>
                      </h4>
                      <Link
                        href={`/artikel/${article.slug}`}
                        className="tf-btn-link"
                      >
                        <span>Lanjut Baca</span>
                        <i className="icon-circle-arrow" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              <div className="sw-pagination sw-pagination-layout text-center d-lg-none d-block mt-20 spd1" />
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
