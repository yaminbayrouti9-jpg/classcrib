"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Star, ArrowRight, Home, ShoppingBag, ShieldCheck, Coins } from "lucide-react";
import Confetti from "react-confetti";

interface LevelUpPopoverProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpPopover({ level, onClose }: LevelUpPopoverProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    handleResize(); // Initial set
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const unlocks = [
    { icon: Coins, title: "Bonus Awarded", desc: "+500 Premium Coins" },
    { icon: Home, title: "Architecture Upgrade", desc: level >= 10 ? "Mansion Style Unlocked" : level >= 5 ? "Modern Villa Unlocked" : level >= 3 ? "Cottage Base Ready" : "Style Progress" },
    { icon: ShieldCheck, title: "Elite Rank Status", desc: `Lvl ${level} permissions` },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        {windowSize.width > 0 && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} gravity={0.1} />
        )}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-text-primary/80 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center text-center p-12 gap-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 scale-150 opacity-10"
            >
               <Sparkles className="w-full h-full text-primary" />
            </motion.div>
            
            <div className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center shadow-2xl shadow-primary/40 relative z-10 rotate-3">
               <Trophy className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-6xl font-black text-text-primary tracking-tighter">LEVEL UP!</h2>
            <div className="flex items-center justify-center gap-3">
               <div className="h-[2px] w-12 bg-gray-100" />
               <span className="text-2xl font-black text-primary uppercase tracking-[0.4em]">Level {level}</span>
               <div className="h-[2px] w-12 bg-gray-100" />
            </div>
          </div>

          <p className="text-text-secondary font-bold text-lg max-w-md">
            Unbelievable progress! Your productivity has reached a new peak. Here's what you've unlocked:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {unlocks.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 border border-gray-100"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                   <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                   <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">{item.title}</h4>
                   <p className="text-[10px] font-bold text-text-secondary mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="btn btn-primary w-full h-16 text-xl shadow-xl shadow-primary/20 flex items-center justify-center group"
          >
            Claim Rewards & Continue <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
