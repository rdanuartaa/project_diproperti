import BlogDetails from "@/components/blogs/BlogDetails";
import Blogs2 from "@/components/blogs/Blogs2";
import RelatedBlogs from "@/components/blogs/RelatedBlogs";

import Breadcumb from "@/components/common/Breadcumb";
import Cta from "@/components/common/Cta";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import { allBlogs } from "@/data/blogs";
import React from "react";

export const metadata = {
  title: "Blog Details || Proty - Real Estate React Nextjs Template",
  description: "Proty - Real Estate React Nextjs Template",
};
export default async function page({ params }) {
  const { id } = await params;

  const blog = allBlogs.filter((elm) => elm.id == id)[0] || allBlogs[0];

  return (
    <>
      <div id="wrapper">
        <Header1 />
        <div className="main-content">
          <Breadcumb pageName="Blog Details" />
          <BlogDetails blog={blog} />
          <RelatedBlogs />
          <Cta />
        </div>
        <Footer1 />
      </div>
    </>
  );
}
