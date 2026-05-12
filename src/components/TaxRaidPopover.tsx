"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Coins, ArrowRight, Gavel } from "lucide-react";

interface TaxRaidPopoverProps {
  onClose: () => void;
}

export default function TaxRaidPopover({ onClose }: TaxRaidPopoverProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-rose-950/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-[40px] shadow-[0_32px_64px_-16px_rgba(225,29,72,0.4)] overflow-hidden flex flex-col items-center text-center p-12 gap-8 border-4 border-rose-500"
        >
          <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-500/40 rotate-12">
             <Gavel className="w-12 h-12 text-white" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-rose-600 font-black uppercase tracking-[0.3em] text-xs">
               <ShieldAlert className="w-4 h-4" /> IRS Tax Raid
            </div>
            <h2 className="text-5xl font-black text-text-primary tracking-tighter">FINES ISSUED!</h2>
          </div>

          <p className="text-text-secondary font-bold text-lg">
            You haven't paid your property taxes for over a week. The authorities have raided your crib and issued a fine.
          </p>

          <div className="bg-rose-50 p-6 rounded-3xl w-full border border-rose-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                   <Coins className="w-6 h-6 text-rose-500" />
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Fine Amount</p>
                   <p className="text-2xl font-black text-rose-600">-1,000 Coins</p>
                </div>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-rose-600/20 flex items-center justify-center group hover:bg-rose-700 transition-all"
          >
            Acknowledge & Pay Fine <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
