"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Timer as TimerIcon, 
  StickyNote, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  AlertCircle,
  Lock,
  ShoppingCart,
  Music,
  Volume2,
  Wind,
  CloudRain,
  Trees
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Deadline Radar Widget
export function DeadlineRadarWidget({ deadlines }: { deadlines: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Deadline Radar
          </h3>
          <p className="text-[10px] text-text-tertiary font-medium">Upcoming tasks and projects</p>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
        {deadlines.length > 0 ? deadlines.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-1.5 h-8 rounded-full",
                item.urgent ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              )} />
              <div>
                <p className="text-xs font-bold text-text-primary">{item.title}</p>
                <p className="text-[9px] text-text-tertiary font-medium">{item.dueIn}</p>
              </div>
            </div>
            {item.urgent && <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />}
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-[10px]">
             Clear skies! No deadlines.
          </div>
        )}
      </div>
    </div>
  );
}

// Focus Timer Widget
export function FocusTimerWidget({ isLocked }: { isLocked?: boolean }) {
  const [time, setTime] = useState(1500); // 25 mins
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, time]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-full w-full">
      <div className={clsx(
        "flex flex-col h-full items-center justify-between py-2 transition-all",
        isLocked && "blur-sm pointer-events-none opacity-50"
      )}>
        <div className="text-center">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Focus Timer</p>
          <div className="text-4xl font-black text-text-primary tabular-nums tracking-tighter">
            {formatTime(time)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
              isActive ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-primary text-white shadow-primary/20"
            )}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </button>
          <button 
            onClick={() => { setIsActive(false); setTime(1500); }}
            className="w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-[9px] font-bold text-text-tertiary uppercase">Pomodoro Session</p>
      </div>

      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[2px] rounded-2xl p-4 text-center">
           <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-primary" />
           </div>
           <p className="text-[10px] font-black text-text-primary uppercase tracking-widest leading-tight mb-2">Timer Locked</p>
           <Link 
             href="/money" 
             className="px-3 py-1.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:shadow-lg transition-all"
           >
              <ShoppingCart className="w-2.5 h-2.5" /> Buy in Shop
           </Link>
        </div>
      )}
    </div>
  );
}

// Quick Notes Widget
export function QuickNotesWidget() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/user/scratchpad");
        const data = await res.json();
        if (data.scratchpad) setContent(data.scratchpad);
      } catch (e) {
        console.error("Failed to fetch notes", e);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (content === "") return;
    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);
      try {
        await fetch("/api/user/scratchpad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content })
        });
      } catch (e) {
        console.error("Failed to save notes", e);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [content]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-primary" /> Scratchpad
        </h3>
        {isSaving && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Saved</span>}
      </div>
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a quick note..."
        className="flex-1 w-full bg-background border border-card-border rounded-xl p-3 text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-primary/20 transition-all resize-none no-scrollbar"
      />
    </div>
  );
}

// Zen Ambiance Widget
export function ZenAmbianceWidget({ isLocked }: { isLocked?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSound, setActiveSound] = useState('Lo-Fi');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  const soundUrls: any = {
    'Lo-Fi': 'https://stream.zeno.fm/0r0xa792kwzuv', // Lofi Radio
    'Rain': 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg',
    'Forest': 'https://actions.google.com/sounds/v1/ambient/forest_ambience.ogg',
    'White': 'https://actions.google.com/sounds/v1/ambient/white_noise.ogg'
  };

  const togglePlay = () => {
    if (isPlaying) {
      audio?.pause();
      setIsPlaying(false);
    } else {
      let newAudio = audio;
      if (!newAudio) {
        newAudio = new Audio(soundUrls[activeSound]);
        newAudio.loop = true;
        setAudio(newAudio);
      }
      newAudio.play().catch(e => console.error("Audio play blocked", e));
      setIsPlaying(true);
    }
  };

  const switchSound = (name: string) => {
    setActiveSound(name);
    if (audio) {
      audio.pause();
      audio.src = soundUrls[name];
      if (isPlaying) {
        audio.play().catch(e => console.error("Audio play blocked", e));
      }
    }
  };

  const sounds = [
    { name: 'Lo-Fi', icon: Music, color: 'text-indigo-500' },
    { name: 'Rain', icon: CloudRain, color: 'text-blue-500' },
    { name: 'Forest', icon: Trees, color: 'text-emerald-500' },
    { name: 'White', icon: Wind, color: 'text-text-tertiary' },
  ];

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full">
      <div className={clsx(
        "flex flex-col h-full transition-all",
        isLocked && "blur-sm pointer-events-none opacity-50"
      )}>
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-primary" /> Zen Ambiance
           </h3>
           {isPlaying && <span className="text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">Playing</span>}
        </div>

        <div className="flex-1 bg-card-hover border border-card-border rounded-2xl p-4 flex flex-col items-center justify-center gap-4 shadow-inner">
           <button 
             onClick={togglePlay}
             className={clsx(
               "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl",
               isPlaying ? "bg-primary text-white scale-110 shadow-primary/40" : "bg-card border border-card-border text-text-secondary"
             )}
           >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
           </button>
           <p className="text-xs font-black text-text-primary uppercase tracking-widest">{activeSound}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
           {sounds.map((s) => (
             <button 
               key={s.name}
               onClick={() => switchSound(s.name)}
               className={clsx(
                 "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                 activeSound === s.name ? "bg-primary/10 border-primary" : "bg-card border-card-border hover:bg-card-hover"
               )}
             >
                <s.icon className={clsx("w-4 h-4", activeSound === s.name ? "text-primary" : "text-text-tertiary")} />
                <span className="text-[8px] font-bold uppercase tracking-tighter">{s.name}</span>
             </button>
           ))}
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[2px] rounded-2xl p-4 text-center">
           <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2 border border-primary/20">
              <Lock className="w-5 h-5 text-primary" />
           </div>
           <p className="text-[10px] font-black text-text-primary uppercase tracking-widest leading-tight mb-2">Ambiance Locked</p>
           <Link 
             href="/money" 
             className="px-3 py-1.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:shadow-lg transition-all"
           >
              <ShoppingCart className="w-2.5 h-2.5" /> Buy in Shop
           </Link>
        </div>
      )}
    </div>
  );
}
