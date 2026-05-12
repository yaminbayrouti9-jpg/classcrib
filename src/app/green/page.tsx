"use client";

import { Leaf, Droplets, Sun, Award, Sparkles, Trophy, ArrowRight, Zap, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function GoGreenPage() {
  const { data: session } = useSession();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchStats = async () => {
    const res = await fetch("/api/user/stats");
    const data = await res.json();
    if (data.success) setUserStats(data.stats);
  };

  useEffect(() => {
    if (session) fetchStats();
  }, [session]);

  const handleAction = async (type: string, amount: number = 0) => {
    setLoading(type);
    try {
      const res = await fetch("/api/user/green", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: type, amount }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const greenXp = userStats?.greenXp || 0;
  const greenLevel = Math.floor(greenXp / 100) + 1;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-green-500/20">
            <Leaf className="w-3 h-3" /> Environmental Hero
          </div>
          <h2 className="text-5xl font-black text-text-primary tracking-tighter">Go Green</h2>
          <p className="text-text-secondary font-bold text-lg">Every eco-friendly action builds a better neighborhood.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bento-card border-none bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-200 flex flex-col justify-between py-10 px-12">
           <div className="flex justify-between items-start">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Global Ranking</p>
                 <h3 className="text-5xl font-black tracking-tighter">Level {greenLevel} <span className="text-xl text-white/40 italic">Guardian</span></h3>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                 <Trophy className="w-10 h-10" />
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                 <span>{greenXp % 100} / 100 XP to next level</span>
                 <span>{greenXp} Total XP</span>
              </div>
              <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${greenXp % 100}%` }} />
              </div>
           </div>
        </div>

        <div className="bento-card border-accent-gold/50 bg-accent-gold/5 flex flex-col justify-between text-center">
           <div className="w-16 h-16 bg-accent-gold rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-gold/30">
              <Sparkles className="w-8 h-8 text-white" />
           </div>
           <div>
              <h4 className="text-xl font-black text-text-primary tracking-tight">Eco Bonus</h4>
              <p className="text-xs font-bold text-text-secondary mt-1">Claim your daily 10 XP points!</p>
           </div>
           <button 
             onClick={() => handleAction('daily_claim')}
             disabled={loading === 'daily_claim'}
             className="w-full btn btn-primary bg-accent-gold hover:bg-orange-400 text-white shadow-none h-12 flex items-center justify-center"
           >
              {loading === 'daily_claim' ? <Loader2 className="animate-spin" /> : 'Claim Rewards'}
           </button>
        </div>

        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
           <GreenActionCard 
              title="Save Water" 
              desc="Reduce shower time by 5 minutes" 
              xp="15" 
              icon={Droplets} 
              color="text-blue-500" 
              bg="bg-blue-50"
              loading={loading === 'Save Water'}
              onAction={() => handleAction('action', 15)}
           />
           <GreenActionCard 
              title="Solar Power" 
              desc="Maximize solar usage during peak sun" 
              xp="25" 
              icon={Sun} 
              color="text-orange-500" 
              bg="bg-orange-50"
              loading={loading === 'Solar Power'}
              onAction={() => handleAction('action', 25)}
           />
           <GreenActionCard 
              title="Plant Trees" 
              desc="Log a tree planting activity" 
              xp="50" 
              icon={Leaf} 
              color="text-green-600" 
              bg="bg-green-50"
              loading={loading === 'Plant Trees'}
              onAction={() => handleAction('action', 50)}
           />
        </div>

        <div className="md:col-span-4 bento-card p-0 overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
              <h3 className="text-xl font-black text-text-primary tracking-tight">Your Badges</h3>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Achievement Level</p>
           </div>
           <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <BadgeIcon icon={Leaf} active={greenXp >= 100} />
              <BadgeIcon icon={Droplets} active={greenXp >= 300} />
              <BadgeIcon icon={Sun} active={greenXp >= 600} />
              <BadgeIcon icon={Zap} active={greenXp >= 1000} />
              <BadgeIcon icon={Award} active={greenXp >= 1500} />
              <BadgeIcon icon={Trophy} active={greenXp >= 2500} />
           </div>
        </div>
      </div>
    </div>
  );
}

function GreenActionCard({ title, desc, xp, icon: Icon, color, bg, onAction, loading }: any) {
  return (
     <div className="bento-card group hover:border-green-500/50 transition-all flex flex-col justify-between h-[280px]">
        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bg, color)}>
           <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-4">
           <div>
              <h4 className="text-xl font-black text-text-primary">{title}</h4>
              <p className="text-xs font-bold text-text-secondary leading-relaxed mt-1">{desc}</p>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-xs font-black text-green-600">+{xp} Green XP</span>
              <button 
                onClick={onAction}
                disabled={loading}
                className="btn bg-gray-50 text-text-primary p-2 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all w-12 h-12 flex items-center justify-center"
              >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
           </div>
        </div>
     </div>
  );
}

function BadgeIcon({ icon: Icon, active = false }: any) {
   return (
      <div className={clsx(
        "aspect-square rounded-[24px] flex items-center justify-center transition-all border-2",
        active ? "bg-white border-green-500 shadow-lg shadow-green-50 opacity-100 scale-100" : "bg-gray-50 border-transparent opacity-20 scale-90"
      )}>
         <Icon className={clsx("w-8 h-8", active ? "text-green-500" : "text-gray-300")} />
      </div>
   );
}
