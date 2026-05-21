import Sidebar from "@/components/dashboard/Sidebar";
import Header1 from "@/components/headers/Header1";
import React from "react";

export const metadata = {
  title: "Dasboard Admin",
  description: "Area pengelolaan internal Diproperti.",
  robots: {
    index: false,
    follow: false,
  },
};
export default function page({ children }) {
  return (
    <>
      <div className="bg-dashboard">
        <div id="wrapper" className="bg-4">
          <Header1 parentClass="header dashboard" />
          <div className="page-layout">
            <Sidebar />
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
