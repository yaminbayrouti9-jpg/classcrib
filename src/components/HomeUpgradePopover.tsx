"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Home, 
  ArrowRight, 
  Trophy, 
  Zap, 
  Droplets, 
  Flag,
  CheckCircle2,
  Lock
} from "lucide-react";
import { clsx } from "clsx";

interface HomeUpgradePopoverProps {
  level: number;
  onClose: () => void;
}

export default function HomeUpgradePopover({ level, onClose }: HomeUpgradePopoverProps) {
  const getUnlocks = (lvl: number) => {
    if (lvl === 5) return [
      { icon: Home, title: "Modern Villa", desc: "Unlock a sleek modern home architecture." },
      { icon: Zap, title: "Wind Turbine", desc: "Clean energy. Reduce electricity bills by 40%." },
      { icon: Flag, title: "Custom Decks", desc: "Add architectural flair to your home." }
    ];
    if (lvl === 10) return [
      { icon: Trophy, title: "Luxury Estate", desc: "The pinnacle of ClassCrib architecture." },
      { icon: Zap, title: "Tesla Powerwall", desc: "Ultimate energy independence." },
      { icon: Droplets, title: "Infinity Pool", desc: "A symbol of peak academic success." }
    ];
    return [
      { icon: Sparkles, title: `Level ${lvl} Status`, desc: "Your property value has increased!" },
      { icon: CheckCircle2, title: "New Capacity", desc: "Better durability against utility cuts." }
    ];
  };

  const unlocks = getUnlocks(level);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="bg-card border-2 border-primary/30 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
        
        <div className="p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-lg animate-bounce-slow">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-text-primary tracking-tighter">Crib Evolution!</h2>
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary text-white rounded-full font-black uppercase tracking-widest text-xs">
              Reached Level {level}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-center text-text-secondary font-bold text-sm">New Features Unlocked:</p>
            <div className="grid gap-4">
              {unlocks.map((u, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-5 p-5 bg-card-hover rounded-2xl border border-card-border group hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <u.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-text-primary text-lg">{u.title}</h4>
                    <p className="text-xs text-text-tertiary font-medium">{u.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            Claim Rewards <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
