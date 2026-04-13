import OdometerComponent from "@/components/common/OdometerComponent";
import { counters2 } from "@/data/facts";
import Image from "next/image";
import React from "react";

export default function Facts() {
  return (
    <section className="section-box-team tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-6">
            <div className="content-inner">
              <div className="heading-section mb-48">
                <h2
                  className="title wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                  data-wow-delay="0s"
                >
                  We are here to Help
                </h2>
              </div>
              <div
                className="content mb-48 wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0s"
              >
                <p className="text-1 description-1 mb-14">
                  If you haven’t experienced it before, the home loan process
                  can feel overwhelming, but our agents will help you stay
                  informed throughout the process, from pre-approval to closing.
                  The first thing to do is consult with a mortgage specialist.
                  If you don’t already have someone in mind, we partner with
                  some of the best lenders in the industry, and we’d be happy to
                  introduce you, so you’ll be taken care of.
                </p>
                <p className="description-2 text-1 mb-24">
                  We stand ready to serve you as your California real estate
                  team.
                </p>
                <a
                  href="#"
                  className="tf-btn bg-color-primary fw-7 pd-12 wow animate__fadeInUp animate__animated"
                  data-wow-duration="1s"
                  data-wow-delay="0s"
                >
                  Meet The Team
                </a>
              </div>
              <div className="wrap-counter">
                {counters2.map((elm, i) => (
                  <div key={i} className="counter-item style-2">
                    <div className="count">
                      <div className="icons">
                        <i className={elm.icon} />
                      </div>
                      <div className="counter-number">
                        <div className="odometer style-2 style-2-1">
                          <OdometerComponent max={elm.number} />
                          {elm.hasSubNumber && <span>{elm.subNumber}</span>}
                        </div>
                        <span className="sub plus">{elm.subText}</span>
                      </div>
                      <p className="text-4">{elm.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="wrap-image">
              <div
                className="image-wrap img-1 hover-img-wrap wow animate__zoomIn animate__animated"
                data-wow-duration="1.5s"
                data-wow-delay="0s"
              >
                <Image
                  className="lazyload parallax-img"
                  data-src="/images/section/section-box-team.jpg"
                  alt=""
                  width={400}
                  height={509}
                  src="/images/section/section-box-team.jpg"
                />
              </div>
              <div
                className="image-wrap img-2 hover-img-wrap wow animate__zoomIn animate__animated"
                data-wow-duration="1.5s"
                data-wow-delay="0s"
              >
                <Image
                  className="lazyload parallax-img"
                  data-src="/images/section/section-box-team-2.jpg"
                  alt=""
                  width={400}
                  height={509}
                  src="/images/section/section-box-team-2.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
