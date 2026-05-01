"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { api } from "@/lib/api";
import "swiper/css";
import "swiper/css/pagination";

export default function RelatedBlogs() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const res = await api.get("/articles", {
          params: {
            page: 1,
            per_page: 6, // Ambil 6 artikel untuk slider
            status: "published",
          },
        });
        const data = res.data.data || [];
        setArticles(data);
      } catch (error) {
        console.error("Gagal ambil related articles:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

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
              <h4 className="heading">Related posts</h4>
              <div className="text-center py-5">Loading articles...</div>
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
            <h4 className="heading">Related posts</h4>
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
                          alt={article.title || "Article image"}
                          src={article.image_url || "/images/default.jpg"}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 33vw"
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
                        <div className="icons">
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
                        <span> Read More </span>
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
