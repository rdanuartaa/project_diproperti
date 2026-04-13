import DropdownSelect from "@/components/common/DropdownSelect";
import Image from "next/image";
import React from "react";

export default function LoanCalculator() {
  return (
    <section className="section-calculate">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="box-calculate">
              <div className="image-wrap">
                <Image
                  className="lazyload parallax-img"
                  data-src="/images/section/section-calculate.jpg"
                  alt=""
                  width={1280}
                  height={472}
                  src="/images/section/section-calculate.jpg"
                />
              </div>
              <form className="form-pre-approved">
                <div className="heading-section mb-48">
                  <h2
                    className="title wow animate__fadeInUp animate__animated"
                    data-wow-duration="1s"
                    data-wow-delay="0s"
                  >
                    Calculate Mortgage Payments
                  </h2>
                  <p
                    className="text-1 wow animate__fadeInUp animate__animated"
                    data-wow-duration="1s"
                    data-wow-delay="0s"
                  >
                    Estimate your payment with our easy-to-use loan calculator.
                    Then get pre-qualified to buy by a local lender.
                  </p>
                </div>
                <div className="cols">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="amount">
                      Total Amount
                    </label>
                    <input type="number" id="amount" placeholder={1000} />
                  </fieldset>
                  <div className="wrap-input">
                    <fieldset className="payment">
                      <label className="text-1 fw-6 mb-12" htmlFor="payment">
                        Down Payment
                      </label>
                      <input type="number" id="payment" placeholder={2000} />
                    </fieldset>
                    <fieldset className="percent">
                      <input
                        className="input-percent"
                        type="text"
                        defaultValue="20%"
                      />
                    </fieldset>
                  </div>
                </div>
                <div className="cols">
                  <fieldset className="interest-rate">
                    <label
                      className="text-1 fw-6 mb-12"
                      htmlFor="interest-rate"
                    >
                      Interest Rate
                    </label>
                    <input type="number" id="interest-rate" placeholder={0} />
                  </fieldset>
                  <div className="select">
                    <label className="text-1 fw-6 mb-12">
                      Amortization Period (months)
                    </label>
                    <div className="nice-select" tabIndex={0}>
                      <span className="current">
                        Select amortization period
                      </span>
                      <ul className="list">
                        <li data-value="" className="option selected">
                          Select amortization period
                        </li>
                        <li data-value="1 month" className="option">
                          1 month
                        </li>
                        <li data-value="2 months" className="option">
                          2 months
                        </li>
                        <li data-value="3 months" className="option">
                          3 months
                        </li>
                        <li data-value="4 months" className="option">
                          4 months
                        </li>
                        <li data-value="5 months" className="option">
                          5 months
                        </li>
                        <li data-value="6 months" className="option">
                          6 months
                        </li>
                      </ul>
                    </div>
                    <DropdownSelect
                      options={[
                        "Select amortization period",
                        "1 month",
                        "2 month",
                        "3 month",
                        "4 month",
                        "5 month",
                        "6 month",
                        "8 month",
                      ]}
                    />
                  </div>
                </div>
                <div className="cols">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="tax">
                      Property Tax
                    </label>
                    <input type="number" id="tax" placeholder="$3000" />
                  </fieldset>
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="insurance">
                      Home Insurance
                    </label>
                    <input type="number" id="insurance" placeholder="$3000" />
                  </fieldset>
                </div>
                <p className="text-1">
                  Your estimated monthly payment: <span>8000</span>
                </p>
                <div className="wrap-btn">
                  <a href="#" className="tf-btn bg-color-primary pd-6 fw-7">
                    Calculate now
                  </a>
                  <a href="#" className="tf-btn style-border pd-7">
                    Start over
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
