"use client";

import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import TopBarWrapper from "./TopBarWrapper";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LevelUpPopover from "./LevelUpPopover";
import TaxRaidPopover from "./TaxRaidPopover";
import { clsx } from "clsx";
import { fetchStatsOnce, invalidateStatsCache } from "@/lib/client-stats";

export default function MainLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const { data: session } = useSession();
  const statsCacheKey = (session?.user as { id?: string } | undefined)?.id || session?.user?.email || "";
  const [isMounted, setIsMounted] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);
  const [showTaxRaid, setShowTaxRaid] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const isPlatformAdminPage = pathname === "/platform-admin" || pathname?.startsWith("/platform-admin/");

  useEffect(() => {
    if (session && !isPublicPage) {
      const role = (session.user as { role?: string }).role;
      if (role !== "Student") return;

      const checkStats = async () => {
        try {
          const data = await fetchStatsOnce(statsCacheKey);
          if (data.success) {
            if (data.stats.showLevelUp) setLevelUpData({ level: Number(data.stats.level) });
            if (data.stats.showTaxRaid) setShowTaxRaid(true);
          }
        } catch (err) {
          console.error("Failed to check stats:", err);
        }
      };
      checkStats();
    }
  }, [session, statsCacheKey, pathname, isPublicPage]);

  const handleCloseLevelUp = async () => {
    if (!levelUpData) return;
    try {
      const response = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ackLevelUp" }),
      });
      if (!response.ok) throw new Error("Unable to acknowledge level-up notice.");
      invalidateStatsCache();
      setLevelUpData(null);
    } catch (err) {
      console.error("Failed to ack level up:", err);
    }
  };

  const handleCloseTaxRaid = async () => {
    try {
      const response = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ackTaxRaid" }),
      });
      if (!response.ok) throw new Error("Unable to acknowledge utility notice.");
      invalidateStatsCache();
      setShowTaxRaid(false);
    } catch (err) {
      console.error("Failed to ack utility notice:", err);
    }
  };

  const isWorkspace = pathname?.includes("/classes/") && pathname?.split("/").length > 2;

  if (!isMounted && !isPublicPage && !isPlatformAdminPage) return <div className="min-h-screen bg-background" suppressHydrationWarning />;

  return (
    <div className="flex" suppressHydrationWarning>
      {!isPublicPage && !isPlatformAdminPage && <SidebarWrapper />}
      <div className={clsx(
        "flex-1 min-h-screen flex flex-col transition-all",
        !isPublicPage && !isPlatformAdminPage ? "ml-64" : "ml-0"
      )} suppressHydrationWarning>
        {!isPublicPage && !isPlatformAdminPage && <TopBarWrapper />}
        <main className={clsx(
          "flex-1",
          !isPublicPage && !isWorkspace && !isPlatformAdminPage && "p-10",
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
