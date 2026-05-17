"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BackToTop from "@/components/common/BackToTop";
import MobileMenu from "@/components/headers/MobileMenu";
import { AuthProvider } from "@/context/AuthContext";
import { CompareProvider } from "@/components/compare/CompareContext";
import CompareBar from "@/components/compare/CompareBar";

export default function AppClientShell({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const mobileMenuProps = {
    logoSrc: "/images/diproperti/logofirst.svg",
    loginLabel: "Masuk",
    whatsappLabel: "Hubungi Admin",
    whatsappHref:
      "https://wa.me/6281234776677?text=Halo%20Admin,%20saya%20ingin%20menambahkan%20properti",
    supportTitle: "Butuh bantuan?",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const closeBootstrapUI = async () => {
      const bootstrap = await import("bootstrap/dist/js/bootstrap.bundle.min.js");

      document.querySelectorAll(".modal.show").forEach((modal) => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
      });

      document.querySelectorAll(".offcanvas.show").forEach((offcanvas) => {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvas);
        if (offcanvasInstance) offcanvasInstance.hide();
      });
    };

    closeBootstrapUI();
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;

    let wowInstance;

    const initWow = async () => {
      const WOWModule = await import("@/utlis/wow");
      const WOW = WOWModule.default;

      wowInstance = new WOW({
        animateClass: "animated",
        offset: 100,
        mobile: true,
        live: false,
      });

      wowInstance.init();
    };

    const timer = setTimeout(() => {
      initWow();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (wowInstance?.sync) {
        wowInstance.sync();
      }
    };
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;

    let animationFrameId;

    const handleSticky = () => {
      const navbar = document.querySelector(".header");

      if (!navbar) return;

      if (window.scrollY > 120) {
        navbar.classList.add("fixed", "header-sticky");
      } else {
        navbar.classList.remove("fixed", "header-sticky");
      }

      if (window.scrollY > 300) {
        navbar.classList.add("is-sticky");
      } else {
        navbar.classList.remove("is-sticky");
      }
    };

    window.addEventListener("scroll", handleSticky);
    animationFrameId = window.requestAnimationFrame(handleSticky);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleSticky);
    };
  }, [mounted, pathname]);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <CompareProvider>
        {children}
        <CompareBar />
        <BackToTop />
        <MobileMenu {...mobileMenuProps} />
      </CompareProvider>
    </AuthProvider>
  );
}
