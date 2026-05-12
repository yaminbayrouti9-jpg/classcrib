"use client";

import React from 'react';
import { 
  Trophy, 
  Users, 
  ChevronRight,
  Medal,
  Star,
  MessageSquare,
  Clock,
  Home
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

// Leaderboard Widget
export function LeaderboardWidget({ students }: { students: any[] }) {
  const [mode, setMode] = React.useState<'academic' | 'property'>('academic');
  
  const sortedStudents = [...students].sort((a, b) => 
    mode === 'academic' ? (b.xp || 0) - (a.xp || 0) : (b.homeLevel || 0) - (a.homeLevel || 0)
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-3xl p-6 relative overflow-hidden group border border-card-border shadow-sm">
      <div className="flex justify-between items-center mb-8 relative z-10 border-b border-card-border/50 pb-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-text-primary tracking-tight">
            Hall of Fame
          </h3>
          <p className="text-[9px] text-text-tertiary font-black uppercase tracking-[0.2em] opacity-60">Elite Standings</p>
        </div>
        
        {/* Minimalist Toggle */}
        <div className="flex p-1 bg-card-hover/50 rounded-xl border border-card-border/50">
          <button 
            onClick={() => setMode('academic')}
            className={clsx(
              "p-1.5 rounded-lg transition-all",
              mode === 'academic' ? "bg-card text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setMode('property')}
            className={clsx(
              "p-1.5 rounded-lg transition-all",
              mode === 'property' ? "bg-card text-indigo-500 shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="space-y-4 relative z-10 flex-1 overflow-y-auto no-scrollbar">
        {sortedStudents.length > 0 ? sortedStudents.slice(0, 5).map((student, i) => (
          <div key={student._id || i} className="flex items-center justify-between group/item transition-all">
            <div className="flex items-center gap-4">
              <span className={clsx(
                "text-xs font-black w-4 transition-colors",
                i === 0 ? "text-primary" : "text-text-tertiary/40 group-hover/item:text-text-secondary"
              )}>
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary group-hover/item:text-primary transition-colors tracking-tight">@{student.username || "Anonymous"}</p>
                <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-tight opacity-50">
                  {mode === 'academic' ? `Scholar Level ${student.level || 1}` : `Estate Level ${student.homeLevel || 1}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={clsx("text-sm font-black tracking-tight", mode === 'academic' ? "text-text-primary" : "text-indigo-500")}>
                {mode === 'academic' ? (student.xp?.toLocaleString() || 0) : (student.homeLevel || 1)}
              </p>
              <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest opacity-40">{mode === 'academic' ? 'Points' : 'Level'}</p>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-[10px]">
             No rankings yet
          </div>
        )}
      </div>

      <Link href="/rankings" className="mt-6 flex items-center justify-center group/link relative z-10">
         <div className="px-6 py-2 rounded-full border border-card-border text-[9px] font-black uppercase tracking-widest text-text-tertiary group-hover/link:text-primary group-hover/link:border-primary/30 transition-all bg-card-hover/30">
            View All Standings
         </div>
      </Link>
    </div>
  );
}

// Community Pulse Widget
export function CommunityPulseWidget({ activities }: { activities: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Neighborhood
          </h3>
          <p className="text-[10px] text-text-tertiary font-medium">Recent community activity</p>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
        {activities.length > 0 ? activities.map((activity, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-card-hover transition-all group">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px] border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
              {activity.user?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] text-text-primary leading-tight font-bold truncate">
                  {activity.user} <span className="font-medium text-text-tertiary">{activity.action}</span>
               </p>
               <p className="text-[9px] text-text-tertiary flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" /> {activity.time}
               </p>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-[10px]">
             Quiet neighborhood...
          </div>
        )}
      </div>
    </div>
  );
}
