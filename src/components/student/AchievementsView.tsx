"use client";

import { 
  Trophy, 
  Star, 
  Coins, 
  Zap, 
  Home, 
  Flame, 
  Medal, 
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Search,
  FileText,
  Download,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { getBadgeIcon } from "@/lib/badges";
import { getNextLevelProgress, getLevelFromXp } from "@/lib/leveling";
import Link from "next/link";

interface AchievementsViewProps {
  user: any;
}

export default function AchievementsView({ user }: AchievementsViewProps) {
  const currentLevel = getLevelFromXp(user.xp || 0);
  const hasPdfLicense = user.purchasedItems?.includes('pdf_export');

  const stats = [
    // ...
    { label: "Total Coins", value: user.coins?.toLocaleString() || "0", icon: Coins, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { label: "Total XP", value: user.xp?.toLocaleString() || "0", icon: Zap, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    { label: "Current Streak", value: `${user.streak || 0} Days`, icon: Flame, color: "text-rose-500", bgColor: "bg-rose-500/10" },
    { label: "Scholar Level", value: `Level ${currentLevel}`, icon: Trophy, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Crib Level", value: `Level ${user.homeLevel || 1}`, icon: Home, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "Social Streak", value: `${user.socialStreak || 0} Days`, icon: Star, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  ];

  const badges = user.badges || [];
  const levelProgress = getNextLevelProgress(user.xp || 0);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12 animate-fade-in pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-card border border-card-border p-10 md:p-16 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors duration-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full w-fit mx-auto md:mx-0 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
              <Award className="w-3 h-3" /> Career Milestone
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-7xl font-black text-text-primary tracking-tighter leading-tight">
                Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">Legacy.</span> 
              </h1>
              <p className="text-text-secondary font-medium text-lg max-w-xl">Track your growth, collect prestigious badges, and rise to the top of the ClassCrib community.</p>
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-3 pt-4 max-w-md mx-auto md:mx-0">
               <div className="flex justify-between items-end">
                  <p className="text-xs font-black uppercase tracking-widest text-text-primary">Level {levelProgress.currentLevel}</p>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{levelProgress.xpRemaining.toLocaleString()} XP to Level {levelProgress.nextLevel}</p>
               </div>
               <div className="h-4 w-full bg-card-hover rounded-full border border-card-border overflow-hidden p-1 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress.progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full shadow-lg shadow-primary/20"
                  />
               </div>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center md:text-left">
                 {Math.round(levelProgress.progress)}% Mastery Achieved
               </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 bg-card-hover/50 p-8 rounded-[2.5rem] border border-card-border shadow-xl backdrop-blur-sm min-w-[240px]">
             <div className="w-24 h-24 rounded-3xl bg-primary text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-primary/20">
                {user.username?.charAt(0)}
             </div>
             <div className="text-center">
                <h3 className="text-xl font-black text-text-primary">@{user.username}</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1 mb-6">Master Scholar</p>
                
                {hasPdfLicense ? (
                   <button 
                     onClick={() => window.print()}
                     className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
                   >
                      <Download className="w-4 h-4" /> Export Portfolio
                   </button>
                ) : (
                   <Link 
                     href="/money"
                     className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-card border border-card-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-all group"
                   >
                      <Lock className="w-4 h-4 group-hover:text-primary" /> 
                      <span>Export Locked</span>
                   </Link>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-card-border rounded-3xl p-6 flex flex-col gap-4 hover:border-primary transition-all group hover:shadow-xl hover:shadow-primary/5"
          >
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bgColor, stat.color)}>
               <stat.icon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest leading-none mb-2">{stat.label}</p>
               <h4 className="text-2xl font-black text-text-primary tracking-tight leading-none">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Badges & Awards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-text-primary tracking-tight">Badge Gallery</h2>
              <p className="text-sm text-text-tertiary font-medium">Achievements awarded by your mentors</p>
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
               {badges.length} Badges
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {badges.length > 0 ? badges.map((badge: any, i: number) => {
               const Icon = getBadgeIcon(badge.icon);
               return (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.05 }}
                   className="group relative bg-card border border-card-border rounded-[2rem] p-6 text-center space-y-4 hover:border-primary transition-all hover:shadow-2xl"
                 >
                    <div className={clsx(
                      "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-500 group-hover:rotate-12",
                      badge.color ? "bg-card shadow-sm" : "bg-primary/10 text-primary border-primary/20"
                    )} style={{ color: badge.color?.includes('text-') ? undefined : badge.color }}>
                       <Icon className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">{badge.label}</h4>
                       <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-[0.2em] mt-1">
                         {new Date(badge.awardedAt).toLocaleDateString()}
                       </p>
                    </div>
                 </motion.div>
               );
             }) : (
               <div className="col-span-full py-20 bg-card/50 border border-dashed border-card-border rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-text-tertiary">
                  <Medal className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">No badges awarded yet</p>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-8">
           <h2 className="text-2xl font-black text-text-primary tracking-tight">Recent Progress</h2>
           <div className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-xl space-y-8">
              <div className="space-y-6">
                 {[
                   { label: "Global Rank", value: `#${user.rank || '?'}` },
                   { label: "Tasks Finished", value: user.tasksCompleted || "0" },
                   { label: "Social Influence", value: `${(user.socialStreak || 0) * 10} pts` },
                 ].map((item) => (
                   <div key={item.label} className="flex justify-between items-center group">
                      <span className="text-sm font-bold text-text-tertiary group-hover:text-text-primary transition-colors">{item.label}</span>
                      <span className="text-sm font-black text-text-primary">{item.value}</span>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-card-border">
                 <button className="w-full py-4 rounded-2xl bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                   View Hall of Fame <ChevronRight className="w-4 h-4" />
                 </button>
              </div>

              <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20 space-y-3">
                 <div className="flex items-center gap-2 text-amber-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Next Milestone</span>
                 </div>
                 <p className="text-xs font-bold text-text-primary leading-relaxed">Reach Level 5 to unlock the <span className="text-amber-500">Golden Manor</span> virtual home expansion!</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
