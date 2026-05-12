"use client";

import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import TopBarWrapper from "./TopBarWrapper";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LevelUpPopover from "./LevelUpPopover";
import TaxRaidPopover from "./TaxRaidPopover";
import { clsx } from "clsx";

export default function MainLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);
  const [showTaxRaid, setShowTaxRaid] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (session && !isPublicPage) {
      const checkStats = async () => {
        try {
          const res = await fetch("/api/user/stats");
          const data = await res.json();
          if (data.success) {
            if (data.stats.showLevelUp) setLevelUpData({ level: data.stats.level });
            if (data.stats.showTaxRaid) setShowTaxRaid(true);
          }
        } catch (err) {
          console.error("Failed to check stats:", err);
        }
      };
      checkStats();

    }
  }, [session, pathname, isPublicPage]);

  const handleCloseLevelUp = async () => {
    if (!levelUpData) return;
    try {
      await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ackLevelUp" }),
      });
      setLevelUpData(null);
    } catch (err) {
      console.error("Failed to ack level up:", err);
    }
  };

  const handleCloseTaxRaid = async () => {
    try {
      await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ackTaxRaid" }),
      });
      setShowTaxRaid(false);
    } catch (err) {
      console.error("Failed to ack tax raid:", err);
    }
  };

  const isWorkspace = pathname?.includes("/classes/") && pathname?.split("/").length > 2;

  if (!isMounted) return <div className="min-h-screen bg-background" suppressHydrationWarning />;

  return (
    <div className="flex" suppressHydrationWarning>
      {!isPublicPage && <SidebarWrapper />}
      <div className={clsx(
        "flex-1 min-h-screen flex flex-col transition-all",
        !isPublicPage ? "ml-64" : "ml-0"
      )} suppressHydrationWarning>
        {!isPublicPage && <TopBarWrapper />}
        <main className={clsx(
          "flex-1",
          !isPublicPage && !isWorkspace && "p-10",
          isWorkspace && "h-[calc(100vh-80px)] overflow-hidden"
        )} suppressHydrationWarning>
          {children}
        </main>
      </div>
      {levelUpData && (
        <LevelUpPopover 
          level={levelUpData.level} 
          onClose={handleCloseLevelUp} 
        />
      )}
      {showTaxRaid && (
        <TaxRaidPopover 
          onClose={handleCloseTaxRaid} 
        />
      )}
    </div>
  );
}


