"use client";

import React, { useState } from "react";
import Nav from "./Nav";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function Header1({ parentClass = "header" }) {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    window.location.href = "http://localhost:8000/api/auth/google/redirect";
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  return (
    <header id="header-main" className={parentClass}>
      <div className="header-inner">
        <div className="tf-container xl">
          <div className="row">
            <div className="col-12">
              <div className="header-inner-wrap">
                <div className="header-logo">
                  <Link href={`/`} className="site-logo">
                    <img
                      className="logo_header"
                      alt=""
                      data-light="/images/logo/logo@2x.png"
                      data-dark="/images/logo/logo-2@2x.png"
                      src="/images/logo/logo@2x.png"
                    />
                  </Link>
                </div>
                <nav className="main-menu">
                  <ul className="navigation ">
                    <Nav />
                  </ul>
                </nav>
                <div className="header-right">
                  <div className="nav-login-item" style={{ marginRight: "20px" }}>
                    {isAuthenticated && user ? (
                      <div
                        className="user-avatar-dropdown"
                        style={{ position: "relative" }}
                      >
                        <button
                          onClick={toggleDropdown}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            borderRadius: "50%",
                            overflow: "hidden",
                          }}
                        >
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="rounded-circle"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "var(--Primary, #4285F4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "400",
                                fontSize: "16px",
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </button>

                        {dropdownOpen && (
                          <div
                            className="dropdown-menu show"
                            style={{
                              position: "absolute",
                              top: "100%",
                              right: 0,
                              marginTop: "10px",
                              minWidth: "200px",
                              backgroundColor: "#fff",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 9999,
                              padding: "8px 0",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 16px",
                                borderBottom: "1px solid #e5e7eb",
                                fontSize: "16px",
                                fontWeight: "400",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: "600",
                                  color: "#1f2937",
                                }}
                              >
                                {user.name}
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: "16px",
                                  color: "#6b7280",
                                  fontWeight: "400",
                                }}
                              >
                                {user.email}
                              </p>
                            </div>
                            <button
                              onClick={handleLogout}
                              className="dropdown-item"
                              style={{
                                padding: "8px 16px",
                                display: "block",
                                width: "100%",
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "400",
                              }}
                            >
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        onClick={handleGoogleLogin}
                        className="nav-link-style"
                        style={{
                          color: "#ffffff",
                          padding: "29px 0",
                          fontWeight: "400",
                          fontSize: "16px",
                          textDecoration: "none",
                          display: "inline-block",
                          cursor: "pointer",
                          transition: "color 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--Primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#ffffff";
                        }}
                      >
                        Masuk
                      </Link>
                    )}
                  </div>
                  <div className="btn-add">
                    {isAuthenticated && isAdmin ? (
                      <Link
                        className="tf-btn style-border pd-23"
                        href={`/admin/add-property`}
                      >
                        Add property
                      </Link>
                    ) : (
                      <a
                        href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20menambahkan%20properti"
                        className="tf-btn style-border pd-23"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        Hubungi Admin
                      </a>
                    )}
                  </div>
                  <div
                    className="mobile-button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#menu-mobile"
                    aria-controls="menu-mobile"
                  >
                    <i className="icon-menu" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
