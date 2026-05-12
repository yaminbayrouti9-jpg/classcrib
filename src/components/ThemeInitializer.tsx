"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const theme = localStorage.getItem("classcrib-theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return null;
}
