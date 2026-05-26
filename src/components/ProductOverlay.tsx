"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Check, 
  AlertTriangle, 
  Coins, 
  Sparkles,
  ArrowRight,
  Loader2,
  Lock
} from "lucide-react";
import { clsx } from "clsx";

interface ProductOverlayProps {
  product: {
    title: string;
    cost: number;
    icon: any; // Lucide Icon
    color: string;
    levelReq?: number;
    description: string;
    advantages: string[];
    disadvantages: string[];
    inPlatformBenefits: string[];
  };
  userCoins: number;
  userLevel: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ProductOverlay({
  product,
  userCoins,
  userLevel,
  loading,
  onConfirm,
  onCancel
}: ProductOverlayProps) {
  const isLocked = product.levelReq !== undefined && userLevel < product.levelReq;
  const isAffordable = userCoins >= product.cost;
  const Icon = product.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      {/* Backdrop click handles cancel, but not when loading */}
      <div className="absolute inset-0" onClick={!loading ? onCancel : undefined} />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-card border-2 border-primary/20 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative z-10"
      >
        {/* Dynamic colored accent bar at top */}
        <div className={clsx("h-2 w-full bg-gradient-to-r", 
          product.color.includes("green") ? "from-green-500 to-emerald-500" :
          product.color.includes("orange") ? "from-orange-500 to-amber-500" :
          product.color.includes("amber") ? "from-amber-500 to-yellow-500" :
          product.color.includes("blue") ? "from-blue-500 to-cyan-500" :
          product.color.includes("indigo") ? "from-indigo-500 to-blue-500" :
          product.color.includes("red") ? "from-red-500 to-rose-500" :
          product.color.includes("purple") ? "from-purple-500 to-fuchsia-500" :
          product.color.includes("pink") ? "from-pink-500 to-rose-500" :
          product.color.includes("rose") ? "from-rose-500 to-red-500" :
          product.color.includes("cyan") ? "from-cyan-500 to-blue-500" :
          "from-primary to-secondary"
        )} />

        <div className="p-8 md:p-10 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* Close button */}
          <button 
            onClick={onCancel}
            disabled={loading}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-5">
            <div className={clsx("p-4 rounded-3xl bg-card-hover border border-card-border shadow-lg flex-shrink-0")}>
              <Icon className={clsx("w-10 h-10", product.color)} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">CRIB SHOP UPGRADE</span>
              <h3 className="text-3xl font-black text-text-primary tracking-tight leading-tight">{product.title}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
                  <Coins className="w-4 h-4" />
                  <span>{product.cost.toLocaleString()} Coins</span>
                </div>
                {product.levelReq !== undefined && (
                  <span className={clsx(
                    "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                    isLocked ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  )}>
                    Lvl {product.levelReq}+ Required {isLocked && "(Locked)"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-text-secondary font-medium leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/5">
            {product.description}
          </p>

          {/* Advantages & Disadvantages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3px]" /> Advantages
              </h4>
              <ul className="space-y-2">
                {product.advantages.map((adv, idx) => (
                  <li key={idx} className="text-xs font-semibold text-text-primary flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Disadvantages
              </h4>
              <ul className="space-y-2">
                {product.disadvantages.map((dis, idx) => (
                  <li key={idx} className="text-xs font-semibold text-text-primary flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{dis}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* In-Platform Benefits Section */}
          <div className="p-5 bg-gradient-to-br from-primary/10 to-secondary/5 border-2 border-primary/20 rounded-2xl space-y-2 shadow-inner">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> In-Platform Benefits
            </h4>
            <div className="space-y-1.5">
              {product.inPlatformBenefits.map((benefit, idx) => (
                <p key={idx} className="text-sm font-black text-text-primary tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {benefit}
                </p>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-14 bg-card-hover border border-card-border hover:bg-card text-text-secondary font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || isLocked || !isAffordable}
              className={clsx(
                "flex-2 sm:flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2",
                isLocked || !isAffordable
                  ? "bg-card-hover text-text-tertiary border border-card-border cursor-not-allowed shadow-none"
                  : "bg-primary text-white hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] shadow-primary/20"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLocked ? (
                <>
                  <Lock className="w-4 h-4" /> Level {product.levelReq} Required
                </>
              ) : !isAffordable ? (
                "Insufficient Coins"
              ) : (
                <>
                  Confirm Purchase <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
