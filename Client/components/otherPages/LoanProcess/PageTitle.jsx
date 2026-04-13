import Link from "next/link";
import React from "react";

export default function PageTitle() {
  return (
    <div className="page-title style-2">
      <div className="tf-container">
        <div className="row justify-center">
          <div className="col-lg-8">
            <div className="content-inner">
              <div className="heading-title">
                <h2 className="title">Home Loan Process</h2>
                <ul className="breadcrumb justify-center">
                  <li>
                    <Link className="home fw-6 text-color-3" href={`/`}>
                      Home
                    </Link>
                  </li>
                  <li>Property Listing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
