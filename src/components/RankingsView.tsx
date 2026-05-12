"use client";

import { Trophy, ArrowUp, ArrowDown, Search, Star, Home, Medal, User as UserIcon } from "lucide-react";
import { clsx } from "clsx";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CertificateModal from "./student/CertificateModal";
import { Leaf } from "lucide-react";

export default function RankingsView({ academicUsers = [], propertyUsers = [], currentUserId }: { academicUsers: any[], propertyUsers: any[], currentUserId: string }) {
  const [mode, setMode] = useState<'academic' | 'property' | 'sustainability'>('academic');
  const [search, setSearch] = useState("");
  const [certificateUser, setCertificateUser] = useState<any>(null);

  const activeUsers = mode === 'academic' ? academicUsers : (mode === 'property' ? propertyUsers : [...academicUsers].sort((a,b) => (b.sustainabilityPoints || 0) - (a.sustainabilityPoints || 0)));

  const filteredUsers = useMemo(() => {
    return activeUsers.filter(u => 
      u.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeUsers]);

  const top3 = activeUsers.slice(0, 3);

  return (
    <div className="space-y-12 animate-fade-in max-w-[1200px] mx-auto p-6 md:p-10 pb-32">
      {/* Header & Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
            Hall of Fame
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter leading-tight">
            The {mode === 'academic' ? 'Scholar' : (mode === 'property' ? 'Crib' : 'Eco')} <span className="text-primary">Elite.</span>
          </h2>
          
          {/* Dual Mode Toggle */}
          <div className="flex p-1 bg-card border border-card-border rounded-2xl w-fit shadow-lg">
            <button 
              onClick={() => setMode('academic')}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === 'academic' ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Star className="w-4 h-4" /> Academic
            </button>
            <button 
              onClick={() => setMode('property')}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === 'property' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Home className="w-4 h-4" /> Crib Estate
            </button>
            <button 
              onClick={() => setMode('sustainability')}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === 'sustainability' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 scale-[1.02]" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Leaf className="w-4 h-4" /> Eco Impact
            </button>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-96">
          <div className="bg-card border border-card-border flex items-center px-6 py-4 gap-3 flex-1 rounded-[2rem] shadow-xl focus-within:border-primary transition-colors group">
            <Search className="w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={`Search ${mode === 'academic' ? 'scholars' : 'estates'}...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold w-full text-text-primary placeholder:text-text-tertiary/50" 
            />
          </div>
        </div>
      </div>

      {/* Podium Section */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-12 items-end pt-12 md:pt-20 px-4"
        >
          {/* 2nd Place */}
          <RankPodium 
            rank={2} 
            user={top3[1]} 
            mode={mode}
            color="from-slate-300 to-slate-500" 
            glowColor="rgba(148,163,184,0.3)"
            height="h-56"
          />
          {/* 1st Place */}
          <RankPodium 
            rank={1} 
            user={top3[0]} 
            mode={mode}
            color="from-amber-400 to-amber-600" 
            glowColor="rgba(245,158,11,0.4)"
            height="h-80"
            active
          />
          {/* 3rd Place */}
          <RankPodium 
            rank={3} 
            user={top3[2]} 
            mode={mode}
            color="from-orange-400 to-orange-700" 
            glowColor="rgba(194,65,12,0.3)"
            height="h-48"
          />
        </motion.div>
      </AnimatePresence>

      {/* Rankings Table */}
      <div className="bento-card p-0 overflow-hidden border border-card-border shadow-2xl mt-12 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-6 px-8 md:px-12 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] border-b border-card-border bg-card-hover/30">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Top Students</div>
          <div className="col-span-1 text-right">{mode === 'academic' ? 'Total XP' : (mode === 'property' ? 'Crib Level' : 'Eco Pts')}</div>
          <div className="col-span-1 text-right hidden md:block">Certificate</div>
        </div>

        <div className="divide-y divide-card-border">
          {filteredUsers.map((user: any, i) => {
             const globalRank = activeUsers.findIndex(u => u._id.toString() === user._id.toString()) + 1;
             if (globalRank <= 3 && !search) return null;

             return (
                <RankRow 
                  key={user._id.toString()}
                  rank={globalRank} 
                  user={user}
                  mode={mode}
                  current={user._id.toString() === currentUserId} 
                  onPrint={() => setCertificateUser({ ...user, rank: globalRank })}
                />
             );
          })}
          {filteredUsers.length === 0 && (
            <div className="py-24 text-center space-y-4">
               <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto border border-card-border">
                  <Search className="w-8 h-8 text-text-tertiary" />
               </div>
               <p className="text-text-tertiary font-bold uppercase tracking-widest text-xs">No records found for "{search}"</p>
            </div>
          )}
       </div>
      </div>

       {certificateUser && (
        <CertificateModal 
          userName={certificateUser.username}
          rank={certificateUser.rank}
          xp={mode === 'academic' ? certificateUser.xp : (mode === 'property' ? certificateUser.homeLevel : (certificateUser.sustainabilityPoints || 0))}
          onClose={() => setCertificateUser(null)}
        />
      )}
    </div>
  );
}

function RankPodium({ rank, user, mode, color, glowColor, height, active = false }: any) {
  const isTBA = !user;
  const username = user?.username || "TBA";
  const initial = user?.username?.charAt(0) || "?";

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: active ? 1.1 : 1, opacity: 1 }}
      className={clsx("flex flex-col items-center gap-8 group order-2", rank === 1 ? "md:order-2" : rank === 2 ? "md:order-1" : "md:order-3")}
    >
      <div className="relative">
        <div className={clsx(
          "w-36 h-36 rounded-[40px] bg-card border-4 border-card-border shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500",
          active ? "border-amber-500/50 shadow-amber-500/20" : "",
          !isTBA && "group-hover:rotate-6"
        )}>
           <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-10", color)} />
           <span className={clsx("text-4xl font-black z-10", isTBA ? "text-text-tertiary opacity-30" : "text-text-primary")}>
             {initial}
           </span>
        </div>
        <div 
          className={clsx("absolute -bottom-5 -right-5 w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-card shadow-2xl z-20 bg-gradient-to-br", color, isTBA && "grayscale opacity-50")}
          style={{ boxShadow: !isTBA ? `0 10px 30px ${glowColor}` : 'none' }}
        >
          <span className="font-black text-white text-2xl">#{rank}</span>
        </div>
        {!isTBA && rank === 1 && (
           <Medal className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-amber-500 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h4 className={clsx("font-black text-2xl tracking-tight leading-none transition-colors", isTBA ? "text-text-tertiary opacity-40 italic" : "text-text-primary group-hover:text-primary")}>
          {username}
        </h4>
        {!isTBA && (
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
            {mode === 'academic' ? `${user.xp?.toLocaleString()} XP` : (mode === 'property' ? `Level ${user.homeLevel} Estate` : `${user.sustainabilityPoints || 0} Eco Pts`)}
          </p>
        )}
      </div>

      <div className={clsx(
        "w-full rounded-t-[3rem] flex flex-col items-center pt-10 bg-gradient-to-b from-card-hover to-transparent border-x border-t border-card-border relative", 
        height,
        isTBA && "opacity-40"
      )}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-card-border to-transparent" />
      </div>
    </motion.div>
  );
}

function RankRow({ rank, user, mode, current = false, onPrint }: any) {
  const isRising = (user.xp || 0) > 1000 || user.homeLevel > 5;

  return (
    <div className={clsx(
      "grid grid-cols-6 px-8 md:px-12 py-6 items-center transition-all group",
      current ? "bg-primary/5" : "hover:bg-card-hover/50"
    )}>
      <div className="col-span-1 font-black text-text-secondary text-xl opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">
        {rank < 10 ? `0${rank}` : rank}
      </div>
      <div className="col-span-3 flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-card border border-card-border flex items-center justify-center font-black text-text-primary shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all group-hover:-rotate-3">
          {user.username.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-text-primary text-lg tracking-tight leading-none group-hover:translate-x-1 transition-transform">@{user.username}</p>
            {current && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase border border-primary/20">You</span>}
          </div>
          <p className="text-[9px] text-text-tertiary mt-1.5 font-bold uppercase tracking-wider">
             {mode === 'academic' ? `Level ${user.level} Scholar` : `${(user.ownedAssets?.length || 0)} Assets Owned`}
          </p>
        </div>
      </div>
      <div className="col-span-1 text-right flex flex-col items-end">
        <p className="font-black text-text-primary text-lg leading-none">
          {mode === 'academic' ? user.xp?.toLocaleString() : (mode === 'property' ? user.homeLevel : (user.sustainabilityPoints || 0))}
        </p>
        <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mt-1">
          {mode === 'academic' ? 'Points' : 'Architecture'}
        </p>
      </div>
      <div className="col-span-1 text-right hidden md:flex justify-end">
        {(rank <= 10 || current) && (
          <button 
            onClick={onPrint}
            className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
          >
            <Medal className="w-3 h-3" /> Certificate
          </button>
        )}
      </div>
    </div>
  );
}
