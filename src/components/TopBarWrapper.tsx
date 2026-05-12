"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

export default function TopBarWrapper() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) return null;

  return <TopBar />;
}
