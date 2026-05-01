"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header2";
import About from "@/components/homes/home-2/About";
import Banner from "@/components/homes/home-2/Banner";
import Blogs from "@/components/homes/home-2/Blogs";
import Categories from "@/components/homes/home-2/Categories";
import Facts from "@/components/homes/home-2/Facts";
import Hero from "@/components/homes/home-2/Hero";
import Properties from "@/components/homes/home-2/Properties";

export default function Home02Page() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("auth_token", token);
      window.location.href = window.location.pathname;
    }
  }, [searchParams]);

  return (
    <>
      <div className="counter-scroll ">
        <div id="wrapper">
          <Header2 />
          <Hero />
          <div className="main-content">
            <Categories />
            <About />
            <Properties />
            <Facts />
            <Blogs />
            <Banner />
          </div>
          <Footer1 />
        </div>
      </div>
    </>
  );
}
