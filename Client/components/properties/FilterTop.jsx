"use client";
import React from "react";
import DropdownSelect from "../common/DropdownSelect";
import Link from "next/link";
import SearchForm from "../common/SearchForm";

export default function FilterTop() {
  return (
    <section className="flat-title style-2">
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-12">
            <div className="title-inner">
              <ul className="breadcrumb">
                <li>
                  <Link className="home fw-6 text-color-3" href={`/`}>Beranda</Link>
                </li>
                <li>Daftar Properti</li>
              </ul>
            </div>
            <div className="wg-filter style-2 relative">
              <div className="form-title style-2">
                <form>
                  <fieldset>
                    <input type="text" placeholder="Alamat, Kota, Kode Pos..." />
                  </fieldset>
                </form>

                <DropdownSelect
                  options={[
                    "Status",
                    "Bungalow",
                    "Apartemen",
                    "Rumah",
                    "Rumah Pintar",
                    "Kantor",
                  ]}
                />
                <DropdownSelect
                  options={[
                    "Tipe",
                    "Bungalow",
                    "Apartemen",
                    "Rumah",
                    "Rumah Pintar",
                    "Kantor",
                  ]}
                />

                <DropdownSelect
                  options={[
                    "Kamar Mandi",
                    "Bathtub Lepas",
                    "Bathtub Pijat",
                    "Bathtub Berdiri",
                    "Bathtub Tanam",
                  ]}
                />

                <DropdownSelect
                  options={[
                    "Kamar Tidur",
                    "Tempat Tidur Twin",
                    "Tempat Tidur Tingkat",
                    "Tempat Tidur Anak",
                    "Tempat Tidur Single",
                  ]}
                />
                <div className="wrap-btn searchFormToggler">
                  <div className="btn-filter show-form">
                    <div className="icons">
                      <svg
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M21 4H14"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 4H3"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12H12"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 12H3"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 20H16"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 20H3"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V6"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 10V14"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 18V22"
                          stroke="#F1913D"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <a href="#" className="tf-btn bg-color-primary pd-3 fw-6">
                    Cari <i className="icon-MagnifyingGlass fw-6" />
                  </a>
                </div>
              </div>
              <SearchForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
