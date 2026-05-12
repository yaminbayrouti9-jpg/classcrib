"use client";

import { useSession } from "next-auth/react";
import { Coins, Star, Bell, Clock, User as UserIcon, Check, Trophy, Home, Send, X, Loader2, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { getNextLevelProgress } from "@/lib/leveling";
import LevelUpPopover from "./LevelUpPopover";

export default function TopBar() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showRankDropdown, setShowRankDropdown] = useState(false);
  const [showDonateDropdown, setShowDonateDropdown] = useState(false);
  const [donateUsername, setDonateUsername] = useState("");
  const [donateAmount, setDonateAmount] = useState(10);
  const [isDonating, setIsDonating] = useState(false);
  const [donationStatus, setDonationStatus] = useState<string | null>(null);
  const role = (session?.user as any)?.role || "Student";

  const fetchStats = async () => {
    const res = await fetch("/api/user/stats");
    const data = await res.json();
    if (data.success) {
      setStats(data.stats);
    }
  };

  const ackLevelUp = async () => {
    await fetch("/api/user/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ackLevelUp" }),
    });
    setStats((prev: any) => ({ ...prev, showLevelUp: false }));
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDonating(true);
    setDonationStatus(null);
    try {
      const res = await fetch("/api/user/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUsername: donateUsername, amount: donateAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setDonationStatus("Success! +" + data.xpGained + " XP");
        fetchStats();
        setTimeout(() => {
          setShowDonateDropdown(false);
          setDonationStatus(null);
          setDonateUsername("");
        }, 2000);
      } else {
        setDonationStatus("Error: " + data.error);
      }
    } catch (err) {
      setDonationStatus("Error: Connection failed");
    } finally {
      setIsDonating(false);
    }
  };

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (data.success) setNotifications(data.notifications);
  };

  useEffect(() => {
    if (!session) return;

    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchStats();
        await fetchNotifications();
      }
    };

    loadData();
    const interval = setInterval(() => {
      if (mounted) fetchNotifications();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session]);


  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications(prev => 
        id === 'all' 
          ? prev.map(n => ({ ...n, isRead: true }))
          : prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-background/80 border-b border-card-border sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or Search could go here */}
      </div>

      <div className="flex items-center gap-4">
        {role === "Student" && (
          <div className="flex items-center gap-2 mr-2 relative">
            <button 
              onClick={() => setShowDonateDropdown(!showDonateDropdown)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95",
                (stats?.coins || 0) < 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20",
                showDonateDropdown && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <Coins className={clsx("w-4 h-4", (stats?.coins || 0) < 0 ? "text-rose-500" : "text-amber-500")} />
              <span className={clsx("font-black text-sm tracking-tight", (stats?.coins || 0) < 0 ? "text-rose-500" : "text-amber-500")}>
                {stats?.coins?.toLocaleString() || "0"}
              </span>
            </button>

            <AnimatePresence>
              {showDonateDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-2 top-full w-64 bg-card rounded-[1.5rem] shadow-2xl border border-card-border p-5 z-50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-text-primary">Quick Gift</h5>
                    <button onClick={() => setShowDonateDropdown(false)}><X className="w-4 h-4 text-text-tertiary" /></button>
                  </div>

                  <form onSubmit={handleDonate} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Friend's Username</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input 
                          type="text"
                          required
                          value={donateUsername}
                          onChange={(e) => setDonateUsername(e.target.value)}
                          placeholder="Username"
                          className="w-full h-10 bg-background border border-card-border rounded-xl pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Amount</label>
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <input 
                          type="number"
                          required
                          min={1}
                          max={stats?.coins || 0}
                          value={donateAmount}
                          onChange={(e) => setDonateAmount(parseInt(e.target.value) || 0)}
                          className="w-full h-10 bg-background border border-card-border rounded-xl pl-9 pr-3 text-xs font-black focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    {donationStatus && (
                      <div className={clsx(
                        "text-[10px] font-bold p-2 rounded-lg text-center",
                        donationStatus.startsWith("Success") ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {donationStatus}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isDonating || (stats?.coins || 0) < donateAmount}
                      className="w-full py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isDonating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Coins"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Level Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all group",
                  showLevelDropdown ? "bg-indigo-500 text-white border-indigo-600" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20"
                )}
              >
                <Star className={clsx("w-4 h-4", showLevelDropdown ? "text-white" : "text-indigo-500")} />
                <span className="font-bold text-sm tracking-tight">Level {stats?.level || "1"}</span>
              </button>

              <AnimatePresence>
                {showLevelDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 bg-card rounded-[2rem] shadow-2xl border border-card-border p-6 z-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <div className="relative space-y-4">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Current Progress</p>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{stats?.xp?.toLocaleString() || "0"} XP</span>
                       </div>

                       {(() => {
                         const progress = getNextLevelProgress(stats?.xp || 0);
                         return (
                           <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                   <p className="text-sm font-black text-text-primary">Level {progress.currentLevel}</p>
                                   <p className="text-[10px] font-bold text-text-tertiary uppercase">Next: Lvl {progress.nextLevel}</p>
                                </div>
                                <div className="h-3 w-full bg-card-hover rounded-full border border-card-border overflow-hidden p-0.5">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${progress.progress}%` }}
                                     className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                                   />
                                </div>
                                <p className="text-[10px] font-bold text-text-secondary text-center italic">
                                  {progress.xpRemaining.toLocaleString()} XP remaining
                                </p>
                              </div>

                              <div className="pt-2 border-t border-card-border space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Next Level Rewards</p>
                                <div className="space-y-1.5">
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-background/50 p-2 rounded-xl border border-card-border">
                                      <div className="w-4 h-4 bg-amber-500/10 rounded flex items-center justify-center">
                                         <Coins className="w-2.5 h-2.5 text-amber-500" />
                                      </div>
                                      Level {progress.nextLevel} Bonus +500 Coins
                                   </div>
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-background/50 p-2 rounded-xl border border-card-border">
                                      <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                                         <Home className="w-2.5 h-2.5 text-primary" />
                                      </div>
                                      {progress.nextLevel === 3 ? "Cottage Base Unlock" : progress.nextLevel === 5 ? "Modern Villa Unlock" : progress.nextLevel === 10 ? "Mansion Style Unlock" : "Architecture Upgrade"}
                                   </div>
                                </div>
                              </div>
                           </div>
                         );
                       })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rank Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowRankDropdown(!showRankDropdown)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all group",
                  showRankDropdown ? "bg-amber-500 text-white border-amber-600" : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                )}
              >
                <Trophy className={clsx("w-4 h-4", showRankDropdown ? "text-white" : "text-amber-500")} />
                <span className="font-bold text-sm tracking-tight">#{stats?.globalRank || "—"}</span>
              </button>

              <AnimatePresence>
                {showRankDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 bg-card rounded-[2rem] shadow-2xl border border-card-border p-6 z-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                    <div className="relative space-y-4">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Global Leaderboard</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Top Scholars</span>
                       </div>

                       <div className="space-y-2">
                          {stats?.topStudents?.map((student: any, i: number) => (
                            <div key={student.username} className={clsx(
                              "flex items-center justify-between p-3 rounded-2xl border transition-all",
                              student.username === session?.user?.name ? "bg-primary/10 border-primary/20 scale-[1.02]" : "bg-background/50 border-card-border"
                            )}>
                               <div className="flex items-center gap-3">
                                  <div className={clsx(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm",
                                    i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-700 text-white" : "bg-card-border text-text-tertiary"
                                  )}>
                                     {i + 1}
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold text-text-primary leading-none">{student.username}</p>
                                     <p className="text-[9px] font-medium text-text-tertiary mt-1">Level {student.level}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{student.xp.toLocaleString()}</p>
                                  <p className="text-[8px] font-bold text-text-tertiary uppercase">XP</p>
                               </div>
                            </div>
                          ))}
                       </div>

                       <button 
                         onClick={() => { setShowRankDropdown(false); window.location.href = '/rankings'; }}
                         className="w-full py-2.5 bg-card-hover hover:bg-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary transition-all flex items-center justify-center gap-2"
                       >
                          View Full Rankings <Trophy className="w-3 h-3" />
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="h-8 w-px bg-card-border mx-2" />

        {/* Level Up Popover */}
        {stats?.showLevelUp && (
          <LevelUpPopover 
            level={stats.level} 
            onClose={() => {
              ackLevelUp();
            }} 
          />
        )}

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group",
              showNotifications ? "bg-primary/10 text-primary border border-primary/20" : "text-text-tertiary hover:bg-card-hover hover:text-text-primary border border-transparent"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-card rounded-2xl shadow-xl border border-card-border p-2 animate-scale-in">
               <div className="flex items-center justify-between p-3 border-b border-card-border mb-2">
                  <h4 className="text-sm font-bold text-text-primary">Notifications</h4>
                  <button onClick={() => markAsRead('all')} className="text-[10px] font-bold uppercase text-primary hover:text-primary-light transition-colors">Mark all as read</button>
               </div>
               <div className="space-y-1 max-h-[350px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div 
                      key={n._id} 
                      onClick={() => markAsRead(n._id)}
                      className={clsx(
                        "p-3 rounded-xl transition-all cursor-pointer group",
                        n.isRead ? "opacity-60 hover:bg-card-hover" : "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                       <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-text-primary leading-tight mb-1">{n.title}</p>
                            <p className="text-[11px] text-text-secondary leading-normal">{n.message}</p>
                          </div>
                          {!n.isRead && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />}
                       </div>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] font-bold text-text-tertiary flex items-center gap-1">
                             <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                       <Bell className="w-8 h-8 text-text-tertiary opacity-30 mx-auto mb-2" />
                       <p className="text-text-tertiary text-xs font-medium">No new notifications</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-card-border ml-2">
          <div className="flex flex-col items-end hidden sm:flex">
            <p className="text-sm font-bold text-text-primary leading-none">{session?.user?.name}</p>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">{role}</p>
          </div>
          <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-text-secondary font-bold border border-card-border overflow-hidden shadow-sm">
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-text-tertiary" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

