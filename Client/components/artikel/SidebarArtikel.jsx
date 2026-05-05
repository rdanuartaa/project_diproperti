"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function SidebarArtikel({
  search,
  onSearchChange,
  onSearchSubmit,
  allTags,
  activeTag,
  onTagSelect,
  popularArticles,
  formatDate,
}) {
  return (
    <div className="tf-sidebar sticky-sidebar">
      {/* SEARCH - Desktop only (responsive via CSS) */}
      <div className="sidebar-search sidebar-item">
        <h4 className="sidebar-title">Cari Artikel</h4>
        <form onSubmit={onSearchSubmit} className="form-search">
          <fieldset>
            <input
              className=""
              type="text"
              placeholder="Masukkan Kata Kunci atau Judul Artikel..."
              name="text"
              tabIndex={2}
              value={search}
              onChange={onSearchChange}
              aria-required="true"
              required
            />
          </fieldset>
          <div className="button-submit">
            <button className="" type="submit">
              <i className="icon-MagnifyingGlass" />
            </button>
          </div>
        </form>
      </div>

      {/* CATEGORIES - Dynamic Tags with Count */}
      <div className="sidebar-item sidebar-categories">
        <h4 className="sidebar-title">Penggunaan Kategori Tag</h4>
        <ul className="list-categories">
          {Array.isArray(allTags) &&
            allTags.map((tagItem) => (
              <li key={tagItem.id} className="flex items-center justify-between">
                <a
                  href="#"
                  className={`text-1 lh-20 fw-5 ${activeTag === tagItem.slug ? "active" : ""}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onTagSelect(tagItem.slug);
                  }}
                >
                  {tagItem.name}
                </a>
                <div className="number">({tagItem.articles_count || 0})</div>
              </li>
            ))}
        </ul>
      </div>

      {/* MOST POPULAR ARTICLES */}
      <div className="sidebar-item sidebar-featured ">
        <h4 className="sidebar-title">Paling Sering Dibaca</h4>
        <ul>
          {Array.isArray(popularArticles) &&
            popularArticles.map((item) => (
              <li key={item.id} className="box-listings hover-img">
                <div className="image-wrap">
                  <Image
                    className="lazyload"
                    alt={item.title || ""}
                    src={item.image_url || "/images/default.jpg"}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 90px, 120px"
                  />
                </div>
                <div className="content">
                  <div className="text-1 title fw-5">
                    <Link href={`/artikel/${item.slug}`}>{item.title}</Link>
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
            ))}
        </ul>
      </div>
    </div>
  );
}
