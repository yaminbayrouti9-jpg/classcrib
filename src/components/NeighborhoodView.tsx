"use client";

import { 
  Users, 
  Home as HomeIcon, 
  MapPin, 
  Search,
  ChevronRight,
  Flame,
  Award,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { useState, useMemo } from "react";
import clsx from "clsx";

export default function NeighborhoodView({ 
  initialClassmates, 
  initialPrivacy,
  socialStreak,
  districtRating 
}: { 
  initialClassmates: any[], 
  initialPrivacy: boolean,
  socialStreak: number,
  districtRating: string
}) {
  const [search, setSearch] = useState("");
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [loading, setLoading] = useState(false);

  const filteredClassmates = useMemo(() => {
    return initialClassmates.filter(c => 
      c.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, initialClassmates]);

  const togglePrivacy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateMode: !isPrivate }),
      });
      if (res.ok) setIsPrivate(!isPrivate);
    } catch (err) {
      console.error("Privacy toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <MapPin className="w-3 h-3" /> The Crib District
          </div>
          <h2 className="text-5xl font-black text-text-primary tracking-tighter">Virtual Neighborhood</h2>
          <p className="text-text-secondary font-bold text-lg">See how your classmates are building their world.</p>
        </div>
        
        <div className="glass px-6 py-3 flex items-center gap-3 w-full md:w-80 shadow-sm border-card-border">
           <Search className="w-5 h-5 text-text-tertiary" />
           <input 
             type="text" 
             placeholder="Search neighbors..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="bg-transparent border-none outline-none text-sm font-medium w-full text-text-primary placeholder:text-text-tertiary" 
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bento-card border-none bg-primary text-white flex items-center justify-between p-8">
            <div>
               <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Total Residents</p>
               <h3 className="text-4xl font-black">{initialClassmates.length + 1}</h3>
            </div>
            <Users className="w-10 h-10 text-white/20" />
         </div>
         <div className="bento-card flex items-center justify-between p-8 bg-card border-card-border">
            <div>
               <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">District Rating</p>
               <h3 className="text-4xl font-black text-text-primary">{districtRating}</h3>
            </div>
            <Award className="w-10 h-10 text-primary/20" />
         </div>
         <div className="bento-card flex items-center justify-between p-8 text-orange-500 bg-card border-card-border">
            <div>
               <p className="text-xs font-bold text-orange-500/50 uppercase tracking-widest mb-1">Social Streak</p>
               <h3 className="text-4xl font-black">{socialStreak} Days</h3>
            </div>
            <Flame className="w-10 h-10 opacity-20" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClassmates.map((neighbor: any) => (
          <div key={neighbor._id} className="bento-card group hover:border-primary/50 transition-all p-0 overflow-hidden flex flex-col bg-card border-card-border">
            <div className="h-48 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center relative">
               <div className="w-24 h-24 bg-card rounded-2xl shadow-xl flex items-center justify-center border-4 border-card-border transition-transform group-hover:scale-110 overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5" />
                  <HomeIcon className="w-10 h-10 text-primary relative z-10 opacity-40" />
               </div>
               <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase text-primary border border-primary/20 tracking-tighter">
                  Level {neighbor.homeLevel || 1}
               </div>
            </div>

            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="text-xl font-black text-text-primary tracking-tight">@{neighbor.username}</h4>
                     <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                        <Flame className="w-4 h-4" /> {neighbor.socialStreak || 0}
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                        {neighbor.xp || 0} XP
                     </span>
                     <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-md">
                        Neighbor
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-6 border-t border-card-border">
                  <div className="text-center p-3 bg-primary/5 rounded-2xl">
                     <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Eco Score</p>
                     <p className="text-sm font-black text-text-primary">{neighbor.greenXp || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-2xl">
                     <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Badges</p>
                     <p className="text-sm font-black text-text-primary">{(neighbor.assets?.gold || 0) + (neighbor.assets?.business || 0) + (neighbor.assets?.property || 0)}</p>
                  </div>
               </div>

               <button className="w-full bg-primary text-white py-4 rounded-2xl mt-6 group-hover:shadow-lg shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center">
                  Visit Crib <ChevronRight className="w-4 h-4 ml-2" />
               </button>
            </div>
          </div>
        ))}

        {filteredClassmates.length === 0 && (
           <div className="lg:col-span-3 py-20 text-center space-y-8 animate-fade-in">
              <div className="w-32 h-32 bg-card rounded-[2.5rem] border border-card-border shadow-2xl mx-auto flex items-center justify-center overflow-hidden">
                 <img src="/cribby-ask.png" alt="Cribby" className="w-full h-full object-contain p-4 opacity-50" />
              </div>
              <div>
                 <h4 className="text-3xl font-black text-text-primary pb-2">{search ? "No neighbors found" : "Community is Quiet"}</h4>
                 <p className="text-text-secondary font-medium max-w-md mx-auto">Try searching for a specific username or wait for others to go public.</p>
              </div>
           </div>
        )}
      </div>

      <div className="bento-card bg-orange-500/5 border-orange-500/10 flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-10 rounded-2xl">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
               <Award className="w-6 h-6" />
            </div>
            <div>
               <h4 className="text-lg font-black text-text-primary">Community Privacy Settings</h4>
               <p className="text-xs font-bold text-text-secondary">Hide your home from the neighborhood while you build your masterpiece.</p>
            </div>
         </div>
         <div 
           onClick={togglePrivacy}
           className="flex items-center gap-3 bg-card p-2 rounded-2xl shadow-sm border border-card-border cursor-pointer group hover:border-orange-500 transition-all"
         >
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-4 select-none">
               {isPrivate ? 'PRIVATE MODE ON' : 'PUBLIC MODE ON'}
            </span>
            <div className={clsx(
               "w-12 h-6 rounded-full p-1 relative transition-colors duration-300",
               isPrivate ? "bg-orange-500" : "bg-primary/10"
            )}>
               <div className={clsx(
                  "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                  isPrivate ? "translate-x-6" : "translate-x-0"
               )}>
                  {loading && <Loader2 className="w-full h-full animate-spin text-orange-500 scale-75" />}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
