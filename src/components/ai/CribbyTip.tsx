"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Lightbulb, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface Tip {
  content: string;
  type: 'info' | 'success' | 'warning';
}

export default function CribbyTip() {
  const { data: session } = useSession();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const res = await fetch("/api/ai/tips");
        const data = await res.json();
        if (data.tip) {
          setTip(data.tip);
        }
      } catch (err) {
        console.error("Failed to fetch AI tip:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTip();
  }, []);

  if (!isVisible || (!tip && !loading)) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent-mint/5 to-secondary/10 opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
        
        <div className="relative glass-premium p-6 rounded-[2.5rem] border border-indigo-500/10 flex gap-5 items-start shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-card border border-card-border flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
             {loading ? (
               <Sparkles className="w-6 h-6 text-primary animate-pulse" />
             ) : (
               <img 
                 src="/cribby-excited.png" 
                 alt="Cribby" 
                 className="w-full h-full object-contain"
               />
             )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10 shadow-sm">
                  Cribby's Pro Tip
                </span>
                {session?.user && (session.user as any).purchasedItems?.includes('ai_turbo') && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/10 shadow-sm flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Turbo
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {loading ? (
              <div className="space-y-2 py-1">
                <div className="h-3 bg-card-hover rounded-full w-full animate-pulse" />
                <div className="h-3 bg-card-hover rounded-full w-2/3 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm font-semibold text-text-primary leading-relaxed pr-4">
                {tip?.content}
              </p>
            )}
            
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase">
                <TrendingUp className="w-3 h-3 text-accent" />
                Boost Productivity
              </div>
              <div className="w-1 h-1 rounded-full bg-card-border" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase">
                <Lightbulb className="w-3 h-3" />
                Financial Smart
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
