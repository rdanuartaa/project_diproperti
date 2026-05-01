"use client";
import SplitTextAnimation from "@/components/common/SplitTextAnimation";
import { categories2 } from "@/data/categories";
import React from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

export default function Categories() {
  return (
    <section className="section-categories style-2 tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center mb-48">
              <h2 className="title split-text effect-right">
                <SplitTextAnimation text="Tipe Properti" />
              </h2>
              <p className="text-1 split-text split-lines-transform">
                Temukan properti impian Anda dari berbagai pilihan terbaik kami
              </p>
            </div>

            {/* ✅ HANYA SATU Swiper — hapus grid statis yang lama */}
            <Swiper
              className="swiper style-pagination"
              spaceBetween={15}
              modules={[Pagination]}
              slidesPerView={1}
              breakpoints={{
                576: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
              }}
              pagination={{
                clickable: true,
                el: ".spd451",
              }}
            >
              {categories2.map((category, index) => (
                <SwiperSlide key={index}>
                  <a href="#" className="categories-item style-2">
                    <div className="icon-box">
                      <i className={`icon ${category.icon}`}></i>
                    </div>
                    <div className="content">
                      <h5 className="mb-8">{category.title}</h5>
                      <p>
                        {category.listings}
                      </p>
                    </div>
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="sw-pagination sw-pagination-mb-1 text-center mt-10 spd451" />

          </div>
        </div>
      </div>
    </section>
  );
}