"use client";
import React from "react";
import CommentSection from "./CommentSection";
import Link from "next/link";
import Image from "next/image";
import { blogData2 } from "@/data/blogs";

export default function BlogDetails({ blog }) {
  return (
    <section className="section-blog-details">
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-8">
            <div className="heading">
              <h2 className="title-heading">{blog.title}</h2>
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
                  <p className="text-color-primary">Kathryn Murphy</p>
                </div>
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
                  <p className="text-color-primary">Furniture</p>
                </div>
                <div className="meta-item flex align-center">
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.925 15C7.35643 15.7343 9.00306 15.9332 10.5682 15.5609C12.1333 15.1885 13.5139 14.2694 14.4613 12.9692C15.4087 11.6689 15.8606 10.0731 15.7354 8.46916C15.6103 6.86524 14.9164 5.35876 13.7789 4.22118C12.6413 3.0836 11.1348 2.38972 9.53088 2.2646C7.92697 2.13947 6.3311 2.59132 5.03086 3.53872C3.73063 4.48612 2.81152 5.86677 2.43917 7.43187C2.06682 8.99697 2.26571 10.6436 3 12.075L1.5 16.5L5.925 15Z"
                      stroke="#A8ABAE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p>0 comment</p>
                </div>
                <div className="meta-item flex align-center">
                  <p>26 August, 2024</p>
                </div>
              </div>
            </div>
            <p className="fw-5 text-color-heading mb-30">
              The housing sector has long been a focal point for investors
              seeking stability and growth. Understanding the dynamics of
              housing stocks and effectively trading within this sector can lead
              to substantial gains.
            </p>
            <div className="image-wrap mb-30">
              <Image
                className="lazyload"
                data-src="/images/blog/blog-details.jpg"
                alt=""
                width={840}
                height={473}
                src="/images/blog/blog-details.jpg"
              />
            </div>
            <div className="wrap-content mb-20">
              <h4 className="mb-18">Understanding Housing Stocks</h4>
              <p className="mb-20">
                Housing stocks encompass companies involved in various aspects
                of the real estate industry, including homebuilders, developers,
                and related service providers. Factors influencing these stocks
                range from interest rates and economic indicators to trends in
                homeownership rates.
              </p>
              <p>
                Pay close attention to economic indicators such as employment
                rates, GDP growth, and consumer confidence. A strong economy
                often correlates with increased demand for housing, benefiting
                related stocks.
              </p>
            </div>
            <div className="quote">
              <p>
                “Lower rates can boost homebuying activity, benefiting housing
                stocks, while higher rates may have the opposite effect.”
              </p>
              <p className="author">
                said Mike Fratantoni, MBA’s chief economist.
              </p>
            </div>
            <div className="group-image">
              <div className="image-wrap">
                <Image
                  className="lazyload"
                  data-src="/images/blog/blog-details-1.jpg"
                  alt=""
                  width={410}
                  height={273}
                  src="/images/blog/blog-details-1.jpg"
                />
              </div>
              <div className="image-wrap">
                <Image
                  className="lazyload"
                  data-src="/images/blog/blog-details-2.jpg"
                  alt=""
                  width={410}
                  height={273}
                  src="/images/blog/blog-details-2.jpg"
                />
              </div>
            </div>
            <div className="wrap-content mb-30">
              <h4 className="mb-16 font-manrope">Identify Emerging Trends</h4>
              <p className="mb-22">
                Stay informed about emerging trends in the housing market, such
                as the demand for sustainable homes, technological advancements,
                and demographic shifts. Companies aligning with these trends may
                present attractive investment opportunities.
              </p>
              <p>
                Take a long-term investment approach if you believe in the
                stability and growth potential of the housing sector. Look for
                companies with solid fundamentals and a track record of success.
                For short-term traders, capitalize on market fluctuations driven
                by economic reports, interest rate changes, or industry-specific
                news. Keep a close eye on earnings reports and government
                housing data releases.
              </p>
            </div>
            <div className="tag-wrap flex justify-between items-center">
              <div className="tags">
                <p>Tags:</p>
                <div className="tags">
                  <a href="#">Personal</a>
                  <a href="#">Business</a>
                </div>
              </div>
              <div className="wrap-social">
                <p>Share this post:</p>
                <ul className="tf-social style-1">
                  <li>
                    <a href="#">
                      <i className="icon-fb" />
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="icon-X" />
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="icon-linked" />
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="icon-ins" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <CommentSection />
          </div>
          <div className="col-lg-4">
            <div className="tf-sidebar">
              <div className="sidebar-search sidebar-item">
                <h4 className="sidebar-title">Search Blog</h4>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="form-search"
                >
                  <fieldset>
                    <input
                      className=""
                      type="text"
                      placeholder="Search"
                      name="text"
                      tabIndex={2}
                      defaultValue=""
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
              <div className="sidebar-item sidebar-categories">
                <h4 className="sidebar-title">Categories</h4>
                <ul className="list-categories">
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Market Updates
                    </a>
                    <div className="number">(50)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Buying Tips
                    </a>
                    <div className="number">(69)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Interior Inspiration
                    </a>
                    <div className="number">(69)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Investment Insights
                    </a>
                    <div className="number">(25)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Home Construction
                    </a>
                    <div className="number">(12)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Legal Guidance
                    </a>
                    <div className="number">(12)</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <a href="#" className="text-1 lh-20 fw-5">
                      Community Spotlight
                    </a>
                    <div className="number">(69)</div>
                  </li>
                </ul>
              </div>
              <div className="sidebar-item sidebar-featured pb-36">
                <h4 className="sidebar-title">Featured Listings</h4>
                <ul>
                  {blogData2.map((post, i) => (
                    <li key={i} className="box-listings hover-img">
                      <div className="image-wrap">
                        <Image
                          className="lazyload"
                          alt=""
                          width={224}
                          height={148}
                          src={post.imageSrc}
                        />
                      </div>
                      <div className="content">
                        <div className="text-1 title fw-5">
                          <Link href={`/blog-details/${post.id}`}>
                            {post.title}
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
                          {post.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sidebar-newslatter sidebar-item">
                <h4 className="sidebar-title">Join Our Newsletter</h4>
                <p>
                  Signup to be the first to hear about exclusive deals, special
                  offers and upcoming collections
                </p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="form-search"
                >
                  <fieldset>
                    <input
                      className=""
                      type="text"
                      placeholder="Search"
                      name="text"
                      tabIndex={2}
                      defaultValue=""
                      aria-required="true"
                      required
                    />
                  </fieldset>
                  <div className="button-submit">
                    <button className="" type="submit">
                      <i className="icon-send-message" />
                    </button>
                  </div>
                </form>
              </div>
              <div className="sidebar-item sidebar-tags">
                <h4 className="sidebar-title">Popular Tags</h4>
                <ul className="tags-list">
                  <li>
                    <a href="#" className="tags-item">
                      Property
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Office
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Finance
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Legal
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Market
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Invest
                    </a>
                  </li>
                  <li>
                    <a href="#" className="tags-item">
                      Renovate
                    </a>
                  </li>
                </ul>
              </div>
              <div className="sidebar-ads">
                <div className="image-wrap">
                  <Image
                    className="lazyload"
                    data-src="/images/blog/ads.jpg"
                    alt=""
                    width={400}
                    height={470}
                    src="/images/blog/ads.jpg"
                  />
                </div>
                <div className="logo relative z-5">
                  <Image
                    alt=""
                    width={272}
                    height={85}
                    src="/images/logo/logo-2@2x.png"
                  />
                </div>
                <div className="box-ads relative z-5">
                  <div className="content">
                    <h4 className="title">
                      <a href="#">
                        We can help you find a local real estate agent
                      </a>
                    </h4>
                    <div className="text-addres">
                      <p>
                        Connect with a trusted agent who knows the market inside
                        out - whether you’re buying or selling.
                      </p>
                    </div>
                  </div>
                  <a href="#" className="tf-btn fw-6 bg-color-primary w-full">
                    Connect with an agent
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
