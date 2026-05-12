"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  Home, 
  TrendingUp, 
  Leaf, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  X
} from "lucide-react";
import { clsx } from "clsx";

interface TutorialStep {
  title: string;
  desc: string;
  icon: any;
  color: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "Earn Money",
    desc: "Complete academic tasks assigned by your teacher to earn liquid coins and XP. The harder the task, the bigger the reward!",
    icon: Coins,
    color: "bg-amber-500"
  },
  {
    title: "Manage Your House",
    desc: "Use your hard-earned coins to upgrade your virtual home. From level 1 cabins to level 10 luxury estates, build your legacy.",
    icon: Home,
    color: "bg-blue-500"
  },
  {
    title: "Smart Investments",
    desc: "Grow your wealth by investing in Gold, Silver, and the CNC500 Index. Diversifying your portfolio is key to long-term success.",
    icon: TrendingUp,
    color: "bg-purple-500"
  },
  {
    title: "Sustainability",
    desc: "Participate in eco-friendly tasks and purchase renewable energy sources like Solar Panels and Wind Turbines to reduce your bills.",
    icon: Leaf,
    color: "bg-emerald-500"
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-card border-2 border-white/10 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative"
      >
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-12 space-y-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit text-[10px] font-black uppercase tracking-widest mx-auto">
            <Sparkles className="w-3 h-3" /> Step {currentStep + 1} of {STEPS.length}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className={clsx("w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl text-white", step.color)}>
                <step.icon className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-text-primary tracking-tighter">{step.title}</h2>
                <p className="text-lg font-medium text-text-secondary leading-relaxed max-w-md mx-auto">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-6 pt-6">
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "h-2 rounded-full transition-all duration-500",
                    i === currentStep ? "w-8 bg-primary" : "w-2 bg-card-border"
                  )} 
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="px-8 h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              {currentStep === STEPS.length - 1 ? "Start Learning" : "Continue"} 
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
