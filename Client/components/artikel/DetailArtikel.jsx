"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

export default function DetailArtikel({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/articles/${slug}`);
        setArticle(res.data);
        setError(null);
      } catch (err) {
        console.error("Gagal ambil artikel:", err);
        setError("Artikel tidak ditemukan");
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const res = await api.get("/tags");
        const tagsData = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setAllTags(tagsData);
      } catch (error) {
        console.error("Gagal ambil tags:", error);
        setAllTags([]);
      }
    };

    const fetchPopularArticles = async () => {
      try {
        const res = await api.get("/articles/popular", {
          params: { limit: 10 }, // Ambil lebih banyak untuk filtering
        });
        let articlesData = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        // ✅ Filter: Exclude artikel yang sedang dibuka + ambil max 5
        if (article?.id) {
          articlesData = articlesData.filter((item) => item.id !== article.id);
        }
        setPopularArticles(articlesData.slice(0, 5));
      } catch (error) {
        console.error("Gagal ambil popular articles:", error);
        setPopularArticles([]);
      }
    };

    fetchArticle();
    fetchTags();
    fetchPopularArticles();
  }, [slug]);

  // ✅ Ulangi fetch popular articles setelah article loaded (untuk filtering yang akurat)
  useEffect(() => {
    if (article?.id) {
      fetchPopularArticles();
    }
  }, [article?.id]);

  const fetchPopularArticles = async () => {
    try {
      const res = await api.get("/articles/popular", {
        params: { limit: 10 },
      });
      let articlesData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      if (article?.id) {
        articlesData = articlesData.filter((item) => item.id !== article.id);
      }
      setPopularArticles(articlesData.slice(0, 5));
    } catch (error) {
      console.error("Gagal ambil popular articles:", error);
      setPopularArticles([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="section-blog-details py-5">
        <div className="tf-container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Memuat artikel...</p>
        </div>
      </section>
    );
  }

  if (error || !article) {
    return (
      <section className="section-blog-details py-5">
        <div className="tf-container text-center">
          <h3 className="mb-3">😔 Artikel Tidak Ditemukan</h3>
          <p className="mb-4">
            {error || "Maaf, artikel yang Anda cari tidak ada."}
          </p>
          <Link href="/artikel" className="tf-btn bg-color-primary">
            ← Kembali ke Daftar Artikel
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-blog-details">
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-8">
            {/* Article Header */}
            <div className="heading">
              <h2 className="title-heading">{article.title}</h2>
              <div className="meta flex">
                <div className="meta-item flex align-center">
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.25 15.75V14.25C14.25 13.4544 13.9339 12.6913 13.3713 12.1287C12.8087 11.5661 12.0456 11.25 11.25 11.25H6.75C5.95435 11.25 5.19129 11.5661 4.62868 12.1287C4.06607 12.6913 3.75 13.4544 3.75 14.25V15.75"
                      stroke="#A8ABAE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 8.25C10.6569 8.25 12 6.90685 12 5.25C12 3.59315 10.6569 2.25 9 2.25C7.34315 2.25 6 3.59315 6 5.25C6 6.90685 7.34315 8.25 9 8.25Z"
                      stroke="#A8ABAE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-color-primary">
                    {article.user?.name || "Admin"}
                  </p>
                </div>
                {article.tags?.[0] && (
                  <div className="meta-item flex align-center">
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 15C15.3978 15 15.7794 14.842 16.0607 14.5607C16.342 14.2794 16.5 13.8978 16.5 13.5V6C16.5 5.60218 16.342 5.22064 16.0607 4.93934C15.7794 4.65804 15.3978 4.5 15 4.5H9.075C8.82414 4.50246 8.57666 4.44196 8.35523 4.32403C8.13379 4.20611 7.94547 4.03453 7.8075 3.825L7.2 2.925C7.06342 2.7176 6.87748 2.54736 6.65887 2.42955C6.44027 2.31174 6.19583 2.25004 5.9475 2.25H3C2.60218 2.25 2.22064 2.40804 1.93934 2.68934C1.65804 2.97064 1.5 3.35218 1.5 3.75V13.5C1.5 13.8978 1.65804 14.2794 1.93934 14.5607C2.22064 14.842 2.60218 15 3 15H15Z"
                        stroke="#A8ABAE"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-color-primary">{article.tags[0].name}</p>
                  </div>
                )}
                <div className="meta-item flex align-center">
                  <p>{formatDate(article.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Featured Image dengan Zoom Effect */}
            <div className="image-box image-zoom-container mb-20">
              <Image
                alt={article.title}
                src={article.image_url || "/images/default.jpg"}
                fill
                className="image-zoom"
                sizes="100vw"
                priority
                style={{ objectFit: "cover" }}
              />
            </div>

            {/* Description */}
            <p
              className="fw-5 text-color-heading mb-20"
              style={{ fontSize: "20px", fontWeight: 600, lineHeight: "1.7" }}
            >
              {article.description}
            </p>

            {/* Article Content */}
            <div
              className="wrap-content mb-20"
              style={{ whiteSpace: "pre-line" }}
            >
              {article.content}
            </div>

            {/* Tags & Social Share */}
            <div className="tag-wrap flex justify-between items-center flex-wrap gap-4">
              {/* Tags - Pill Style Auto-width */}
              <div className="tags">
                <p>Tags:</p>
                <div className="tags-list">
                  {article.tags?.map((tag) => (
                    <span key={tag.id} className="box-tag">
                      <span className="tag-item text-4 text_white fw-6">
                        {tag.name}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              {/* Social Share - WA, IG, FB, TikTok */}
              <div className="wrap-social">
                <p className="mb-2 mb-md-0">Share:</p>
                <ul className="tf-social style-1 d-flex gap-2">
                  {/* WhatsApp */}
                  <li>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(article.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn whatsapp"
                      title="Share via WhatsApp"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </li>
                  {/* Twitter */}
                  <li>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn twitter"
                      title="Share via Twitter"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  </li>
                  {/* Facebook */}
                  <li>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn facebook"
                      title="Share via Facebook"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  </li>
                  {/* TikTok */}
                  <li>
                    <a
                      href={`https://www.tiktok.com/share?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn tiktok"
                      title="Share via TikTok"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="col-lg-4">
            <div className="tf-sidebar">
              {/* FEATURED LISTINGS - Popular Articles dengan Zoom + Exclude Current */}
              <div className="sidebar-item sidebar-featured pb-36">
                <h4 className="sidebar-title">Artikel Terpopuler</h4>
                <ul>
                  {Array.isArray(popularArticles) &&
                  popularArticles.length > 0 ? (
                    popularArticles.slice(0, 5).map((item) => (
                      <li key={item.id} className="box-listings hover-img">
                        <div className="image-wrap image-zoom-container">
                          <Image
                            className="lazyload image-zoom"
                            alt={item.title || ""}
                            src={item.image_url || "/images/default.jpg"}
                            width={224}
                            height={148}
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="content">
                          <div className="text-1 title fw-5">
                            <Link href={`/artikel/${item.slug}`}>
                              {item.title}
                            </Link>
                          </div>
                          <p>
                            <span className="icon">
                              <svg
                                width={16}
                                height={17}
                                viewBox="0 0 16 17"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4.5 2.5V4M11.5 2.5V4M2 13V5.5C2 5.10218 2.15804 4.72064 2.43934 4.43934C2.72064 4.15804 3.10218 4 3.5 4H12.5C12.8978 4 13.2794 4.15804 13.5607 4.43934C13.842 4.72064 14 5.10218 14 5.5V13M2 13C2 13.3978 2.15804 13.7794 2.43934 14.0607C2.72064 14.342 3.10218 14.5 3.5 14.5H12.5C12.8978 14.5 13.2794 14.342 13.5607 14.0607C13.842 13.7794 14 13.3978 14 13M2 13V8C2 7.60218 2.15804 7.22064 2.43934 6.93934C2.72064 6.65804 3.10218 6.5 3.5 6.5H12.5C12.8978 6.5 13.2794 6.65804 13.5607 6.93934C13.842 7.22064 14 7.60218 14 8V13"
                                  stroke="#A8ABAE"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>{" "}
                            </span>
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-center py-3 text-muted">
                      Belum ada artikel populer
                    </li>
                  )}
                </ul>
              </div>

              {/* CATEGORIES */}
              <div className="sidebar-item sidebar-categories">
                <h4 className="sidebar-title">Kategori Tag Artikel</h4>
                <ul className="list-categories">
                  {Array.isArray(allTags) &&
                    allTags.map((tagItem) => (
                      <li
                        key={tagItem.id}
                        className="flex items-center justify-between"
                      >
                        <a
                          href="#"
                          className={`text-1 lh-20 fw-5`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/artikel?tag=${tagItem.slug}`;
                          }}
                        >
                          {tagItem.name}
                        </a>
                        <div className="number">
                          ({tagItem.articles_count || 0})
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
