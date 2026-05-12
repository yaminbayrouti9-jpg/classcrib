"use client";

import React from 'react';
import { 
  Target, 
  Sparkles, 
  Medal, 
  CheckCircle2, 
  Zap,
  MessageSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import clsx from 'clsx';

// Daily Quests Widget
export function DailyQuestsWidget({ quests }: { quests: any[] }) {
  const completedCount = quests.filter(q => q.completed).length;
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Daily Quests
          </h3>
          <p className="text-[10px] text-text-tertiary font-medium">Complete for bonus XP</p>
        </div>
        <div className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 shadow-sm">
          {completedCount} / {quests.length} DONE
        </div>
      </div>
      
      <div className="space-y-2 flex-1">
        {quests.map((quest, i) => (
          <div key={i} className={clsx(
            "flex items-center justify-between p-3 rounded-xl border transition-all",
            quest.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card-hover border-card-border"
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-7 h-7 rounded-lg flex items-center justify-center border",
                quest.completed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-card text-text-tertiary border-card-border"
              )}>
                {quest.completed ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
              </div>
              <p className={clsx("text-xs font-bold", quest.completed ? "text-emerald-600 line-through opacity-60" : "text-text-primary")}>
                {quest.title}
              </p>
            </div>
            {!quest.completed && <div className="text-[9px] font-black text-amber-500">+{quest.reward} CC</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Study Buddy Widget
export function StudyBuddyWidget({ status }: { status: string }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-6 relative overflow-hidden group">
      <div className="relative z-10 space-y-4 max-w-[140px]">
         <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit text-[10px] font-bold uppercase border border-white/20 backdrop-blur-md shadow-lg shadow-black/20">
            <Sparkles className="w-3 h-3 text-amber-300" /> AI Study Buddy
         </div>
         <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight">Cribby is {status}</h3>
            <p className="text-white/70 text-[10px] font-medium leading-tight">Ready to help you with homework or green projects.</p>
         </div>
         <button onClick={() => window.location.href = '/chat'} className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black shadow-xl hover:scale-105 transition-all">
            Chat Now <MessageSquare className="w-3.5 h-3.5" />
         </button>
      </div>
      <img src="/cribby-excited.png" alt="Cribby" className="absolute -right-4 -bottom-4 w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-700 opacity-90" />
    </div>
  );
}

// Achievement Hall Widget
export function AchievementHallWidget({ badges }: { badges: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-6">Achievement Hall</h3>
      <div className="flex flex-wrap gap-3 flex-1 items-start content-start">
        {badges.map((badge, i) => (
          <div key={i} className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center text-text-secondary shadow-sm hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:scale-110 transition-all cursor-pointer group relative">
             <badge.icon className={clsx("w-5 h-5", badge.color)} />
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                {badge.label}
             </div>
          </div>
        ))}
        <button className="w-10 h-10 rounded-full border-2 border-dashed border-card-border flex items-center justify-center text-text-tertiary hover:border-indigo-500 hover:text-indigo-500 transition-all">
           <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-1 text-[9px] font-black text-primary uppercase cursor-pointer hover:underline">
         View Hall <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
