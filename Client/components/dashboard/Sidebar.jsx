"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="wrap-sidebar">
      <div className="sidebar-menu-dashboard">
        <div className="menu-box">
          <ul className="box-menu-dashboard">
            <li
              className={`nav-menu-item ${
                pathname == "/admin/dashboard" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/dashboard`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 2.5H3.33333C2.8731 2.5 2.5 2.8731 2.5 3.33333V9.16667C2.5 9.6269 2.8731 10 3.33333 10H7.5C7.96024 10 8.33333 9.6269 8.33333 9.16667V3.33333C8.33333 2.8731 7.96024 2.5 7.5 2.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.668 2.5H12.5013C12.0411 2.5 11.668 2.8731 11.668 3.33333V5.83333C11.668 6.29357 12.0411 6.66667 12.5013 6.66667H16.668C17.1282 6.66667 17.5013 6.29357 17.5013 5.83333V3.33333C17.5013 2.8731 17.1282 2.5 16.668 2.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.668 10H12.5013C12.0411 10 11.668 10.3731 11.668 10.8333V16.6667C11.668 17.1269 12.0411 17.5 12.5013 17.5H16.668C17.1282 17.5 17.5013 17.1269 17.5013 16.6667V10.8333C17.5013 10.3731 17.1282 10 16.668 10Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5 13.3334H3.33333C2.8731 13.3334 2.5 13.7065 2.5 14.1667V16.6667C2.5 17.1269 2.8731 17.5 3.33333 17.5H7.5C7.96024 17.5 8.33333 17.1269 8.33333 16.6667V14.1667C8.33333 13.7065 7.96024 13.3334 7.5 13.3334Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Dashboard
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/admin/add-user" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/add-user`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 15C16.3807 15 17.5 13.8807 17.5 12.5C17.5 11.1193 16.3807 10 15 10C13.6193 10 12.5 11.1193 12.5 12.5C12.5 13.8807 13.6193 15 15 15Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5013 9.16667C9.34225 9.16667 10.8346 7.67428 10.8346 5.83333C10.8346 3.99238 9.34225 2.5 7.5013 2.5C5.66035 2.5 4.16797 3.99238 4.16797 5.83333C4.16797 7.67428 5.66035 9.16667 7.5013 9.16667Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.33464 12.5H5.0013C4.11725 12.5 3.2694 12.8512 2.64428 13.4763C2.01916 14.1014 1.66797 14.9493 1.66797 15.8333V17.5"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.082 13.6666L17.332 13.4166"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.668 11.5834L11.918 11.3334"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.832 15.5834L14.082 14.8334"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.918 10.1666L16.168 9.41663"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.3333 15.5833L16 14.75"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.0013 10.25L13.668 9.41663"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.918 13.8333L12.7513 13.5"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.25 11.5L18.0833 11.1666"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Kelola user
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/admin/add-properti" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/add-properti`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.16667 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V17.5H4.16667C3.70643 17.5 3.33333 17.1269 3.33333 16.6667V3.33333C3.33333 2.8731 3.70643 2.5 4.16667 2.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66667 6.66667H9.16667"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66667 10H9.16667"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66667 13.3333H9.16667"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.6667 17.5V8.33333C16.6667 7.8731 16.2936 7.5 15.8333 7.5H13.3333"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Kelola properti
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/admin/add-artikel" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/add-artikel`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.16667 2.5H12.5L16.6667 6.66667V17.5H4.16667C3.70643 17.5 3.33333 17.1269 3.33333 16.6667V3.33333C3.33333 2.8731 3.70643 2.5 4.16667 2.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 2.5V6.66667H16.6667"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66667 9.16667H13.3333"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66667 12.5H13.3333"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Kelola artikel
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/admin/add-tagartikel" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/add-tagartikel`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 4.5H12.5L17.5 10L12.5 15.5H3.5C2.95 15.5 2.5 15.05 2.5 14.5V5.5C2.5 4.95 2.95 4.5 3.5 4.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 9.5H13.5083"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Kelola tag
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/admin/add-faq" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/admin/add-faq`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.16667 2.5H12.5L16.6667 6.66667V17.5H4.16667C3.70643 17.5 3.33333 17.1269 3.33333 16.6667V3.33333C3.33333 2.8731 3.70643 2.5 4.16667 2.5Z"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 2.5V6.66667H16.6667"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.75 8.75C8.75 8.05964 9.30964 7.5 10 7.5C10.6904 7.5 11.25 8.05964 11.25 8.75C11.25 9.19363 11.0189 9.60298 10.635 9.83C10.4082 9.96405 10.25 10.2108 10.25 10.475V11"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 13.5H10.0083"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Kelola faq
              </Link>
            </li>
            <li
              className={`nav-menu-item ${
                pathname == "/logout" ? "active" : ""
              } `}
            >
              <Link className="nav-menu-link" href={`/logout`}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.332 14.1667L17.4987 10L13.332 5.83337"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.5 10H7.5"
                    stroke="#A8ABAE"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Logout
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
