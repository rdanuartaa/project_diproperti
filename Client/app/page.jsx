import ThemeController from "@/components/common/ThemeController";
import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header2";
import About from "@/components/homes/home-2/About";
import Agents from "@/components/homes/home-2/Agents";
import Banner from "@/components/homes/home-2/Banner";
import Blogs from "@/components/homes/home-2/Blogs";
import Brands from "@/components/homes/home-2/Brands";
import Categories from "@/components/homes/home-2/Categories";
import Cities from "@/components/homes/home-2/Cities";
import Facts from "@/components/homes/home-2/Facts";
import Hero from "@/components/homes/home-2/Hero";
import Properties from "@/components/homes/home-2/Properties";
import Testimonials from "@/components/homes/home-2/Testimonials";
import React from "react";

export const metadata = {
  title: "Home 02 || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default function page() {
  return (
    <>
      <div className="counter-scroll ">
        <ThemeController themeColor={"theme-color-1"} />
        <div id="wrapper">
          <Header2 />
          <Hero />
          <div className="main-content">
            <Categories />
            <About />
            <Properties />
            <Facts />
            <Agents />
            <Cities />
            <Testimonials />

            <Banner />
            <Brands />
            <Blogs />
          </div>
          <Footer1 logo="/images/logo/logo-3@2x.png" />
        </div>
      </div>
    </>
  );
}
