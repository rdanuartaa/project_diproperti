"use client";

import { useEffect } from "react";

export default function ThemeController({ themeColor }) {
  useEffect(() => {
    document.body.classList.add(themeColor);
    return () => {
      document.body.classList.remove(themeColor);
    };
  }, []);

  return <></>;
}
