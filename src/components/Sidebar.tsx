"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Leaf, 
  Trophy, 
  MessageSquare, 
  Home,
  LogOut,
  Settings,
  Users,
  ClipboardCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  MapPin,
  Medal
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      const fetchStats = async () => {
        try {
          const res = await fetch("/api/user/stats");
          const data = await res.json();
          if (data.success) {
            setPendingCount(data.stats.pendingVerifications || 0);
          }
        } catch (err) {
          console.error("Failed to fetch sidebar stats", err);
        }
      };
      fetchStats();
      // Update every 2 minutes
      const interval = setInterval(fetchStats, 120000);
      return () => clearInterval(interval);
    }
  }, [session]);
  
  if (status === "loading") {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 animate-pulse">
        <div className="p-8 h-20" />
        <div className="flex-1 px-4 space-y-4 pt-10">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-sidebar-hover rounded-xl w-full" />)}
        </div>
      </aside>
    );
  }

  const role = (session?.user as any)?.role || "Student";

  const studentItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "My Classes", href: "/classes" },
    { icon: CheckSquare, label: "Assignments", href: "/tasks" },
    { icon: MapPin, label: "Community", href: "/neighborhood" },
    { icon: Wallet, label: "Marketplace", href: "/money" },
    { icon: Trophy, label: "Leaderboards", href: "/rankings" },
    { icon: Medal, label: "Achievements", href: "/achievements" },
    { icon: "/cribby-ask.png", label: "Ask Cribby", href: "/chat", isImage: true },
    { icon: Home, label: "Virtual Home", href: "/virtual-home" },
  ];

  const teacherItems = [
    { icon: LayoutDashboard, label: "Admin Console", href: "/dashboard" },
    { icon: Users, label: "My Classes", href: "/classes" },
    { icon: CheckSquare, label: "Assignment Manager", href: "/tasks" },
    { icon: ClipboardCheck, label: "Verifications", href: "/verify", badge: pendingCount },
    { icon: Trophy, label: "Leaderboards", href: "/rankings" },
    { icon: Sparkles, label: "Reward Students", href: "/rewards" },
    { icon: "/cribby-idea.png", label: "AI Assistance", href: "/chat", isImage: true },
  ];

  const menuItems = role === "Teacher" ? teacherItems : studentItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative overflow-hidden rounded-xl shadow-lg shadow-indigo-500/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight leading-none">
              ClassCrib
            </h1>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Earn. Learn. Grow.</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar pb-10">
        <p className="px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4">Navigation</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const isSoon = (item as any).soon;

          return (
            <Link
              key={item.href}
              href={isSoon ? "#" : item.href}
              className={clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                isActive 
                  ? "bg-primary/10 text-sidebar-active shadow-sm" 
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-text-primary",
                isSoon && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={clsx(
                "w-5 h-5 flex items-center justify-center shrink-0",
                isActive ? "text-sidebar-active" : "text-text-tertiary group-hover:text-text-secondary"
              )}>
                {(item as any).isImage ? (
                  <img src={item.icon as string} alt="" className="w-full h-full object-contain" />
                ) : (
                  <item.icon className="w-full h-full transition-colors" />
                )}
              </div>
              <span className="text-sm font-bold flex-1">{item.label}</span>
              
              { (item as any).badge !== undefined && (item as any).badge > 0 && (
                <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-primary/20 animate-pulse">
                   {(item as any).badge}
                </span>
              )}

              {isActive && (
                <div className="ml-auto">
                   <ChevronRight className="w-4 h-4 text-sidebar-active" />
                </div>
              )}
              {isSoon && (
                 <span className="ml-auto text-[8px] font-black uppercase bg-sidebar-hover px-1.5 py-0.5 rounded text-text-tertiary">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <Link href="/settings" className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
            pathname === "/settings" ? "bg-sidebar-hover text-text-primary" : "text-sidebar-text hover:bg-sidebar-hover hover:text-text-primary"
          )}>
          <Settings className="w-5 h-5 text-text-tertiary" />
          <span className="text-sm font-bold">Settings</span>
        </Link>
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50/10 transition-all mt-1"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

