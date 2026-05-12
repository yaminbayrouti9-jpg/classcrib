"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Coins, 
  Zap, 
  Trophy, 
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { PREDEFINED_BADGES, getBadgeIcon } from "@/lib/badges";

interface RewardStudentsProps {
  initialClasses: any[];
}

export default function RewardStudents({ initialClasses }: RewardStudentsProps) {
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Reward details
  const [coins, setCoins] = useState(50);
  const [xp, setXp] = useState(100);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [reason, setReason] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSelectClass = async (cls: any) => {
    setSelectedClass(cls);
    setLoadingStudents(true);
    setStep(2);
    try {
      const res = await fetch(`/api/classes/${cls._id}`);
      const data = await res.json();
      if (res.ok) {
        setClassStudents(data.class.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleReward = async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await fetch("/api/teacher/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
          coins,
          xp,
          badge: selectedBadge,
          reason
        })
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setStep(1);
          setSelectedStudents([]);
          setSelectedBadge(null);
          setReason("");
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reward students");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm">
            <Sparkles className="w-3 h-3" /> Teacher Console
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter leading-tight">
            Reward <span className="text-primary">Excellence.</span>
          </h1>
          <p className="text-text-secondary font-medium">Award badges, coins, and XP to motivate your students.</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center gap-3 bg-card border border-card-border p-2 rounded-2xl shadow-xl">
           {[1, 2, 3].map(i => (
             <div 
               key={i}
               className={clsx(
                 "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all duration-300",
                 step === i ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : 
                 step > i ? "bg-emerald-500 text-white" : "bg-card-hover text-text-tertiary"
               )}
             >
               {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-emerald-500/30 rounded-[2.5rem] p-16 text-center space-y-6 shadow-2xl shadow-emerald-500/10"
          >
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20 animate-bounce">
               <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-text-primary tracking-tight">Rewards Dispatched!</h2>
            <p className="text-text-secondary max-w-md mx-auto">Your students have been notified and their stats have been updated successfully.</p>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Step 1: Select Class */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialClasses.map((cls) => (
                  <button
                    key={cls._id}
                    onClick={() => handleSelectClass(cls)}
                    className="group relative overflow-hidden bg-card border border-card-border rounded-[2rem] p-8 text-left hover:border-primary transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Users className="w-20 h-20" />
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">{cls.name}</h3>
                        <p className="text-sm text-text-tertiary font-medium">{(cls.students?.length || 0)} Students</p>
                      </div>
                      <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest gap-1 mt-4">
                         Select Class <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Select Students */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <button 
                     onClick={() => setStep(1)}
                     className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors"
                   >
                     <ChevronLeft className="w-4 h-4" /> Back to Classes
                   </button>
                   <p className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                     {selectedStudents.length} Selected
                   </p>
                </div>

                <div className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">Select Students</h3>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setSelectedStudents(classStudents.map(s => s._id))}
                         className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-primary transition-colors"
                       >
                         Select All
                       </button>
                       <span className="text-text-tertiary/20">|</span>
                       <button 
                         onClick={() => setSelectedStudents([])}
                         className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-rose-500 transition-colors"
                       >
                         Deselect All
                       </button>
                    </div>
                  </div>

                  {loadingStudents ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-tertiary">
                       <Loader2 className="w-10 h-10 animate-spin text-primary" />
                       <p className="text-xs font-black uppercase tracking-widest">Loading students...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {classStudents.map((student) => {
                        const isSelected = selectedStudents.includes(student._id);
                        return (
                          <button
                            key={student._id}
                            onClick={() => toggleStudent(student._id)}
                            className={clsx(
                              "flex flex-col items-center p-6 rounded-3xl border-2 transition-all gap-4 relative group",
                              isSelected 
                                ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" 
                                : "bg-card-hover/50 border-transparent hover:border-card-border"
                            )}
                          >
                            <div className={clsx(
                              "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 shadow-sm transition-all",
                              isSelected ? "bg-primary text-white border-primary" : "bg-card border-card-border text-text-primary group-hover:scale-105"
                            )}>
                              {student.username.charAt(0)}
                            </div>
                            <span className={clsx(
                              "text-xs font-bold truncate w-full text-center",
                              isSelected ? "text-primary" : "text-text-secondary"
                            )}>
                              @{student.username}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                 <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    disabled={selectedStudents.length === 0}
                    onClick={() => setStep(3)}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Configure Rewards <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Configure Rewards */}
            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-card border border-card-border rounded-[2.5rem] p-8 md:p-10 shadow-xl space-y-10">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                            <Sparkles className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-black text-text-primary tracking-tight">Reward Package</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Coins Bonus</label>
                           <div className="relative group">
                              <Coins className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500 group-focus-within:scale-110 transition-transform" />
                              <input 
                                type="number" 
                                value={coins}
                                onChange={(e) => setCoins(Number(e.target.value))}
                                className="w-full bg-card-hover border-2 border-transparent rounded-2xl py-6 pl-16 pr-6 text-2xl font-black text-text-primary focus:border-primary focus:bg-card transition-all outline-none" 
                              />
                           </div>
                           <div className="flex gap-2">
                              {[50, 100, 250, 500].map(v => (
                                <button key={v} onClick={() => setCoins(v)} className="flex-1 py-2 rounded-xl bg-card-hover text-[10px] font-black text-text-tertiary hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">+{v}</button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">XP Bonus</label>
                           <div className="relative group">
                              <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 group-focus-within:scale-110 transition-transform" />
                              <input 
                                type="number" 
                                value={xp}
                                onChange={(e) => setXp(Number(e.target.value))}
                                className="w-full bg-card-hover border-2 border-transparent rounded-2xl py-6 pl-16 pr-6 text-2xl font-black text-text-primary focus:border-primary focus:bg-card transition-all outline-none" 
                              />
                           </div>
                           <div className="flex gap-2">
                              {[100, 200, 500, 1000].map(v => (
                                <button key={v} onClick={() => setXp(v)} className="flex-1 py-2 rounded-xl bg-card-hover text-[10px] font-black text-text-tertiary hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">+{v}</button>
                              ))}
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Award Badge (Optional)</label>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {PREDEFINED_BADGES.map((badge) => {
                              const Icon = getBadgeIcon(badge.icon);
                              const isSelected = selectedBadge?.id === badge.id;
                              return (
                                <button
                                  key={badge.id}
                                  onClick={() => setSelectedBadge(isSelected ? null : badge)}
                                  className={clsx(
                                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all gap-2 relative group",
                                    isSelected ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "bg-card-hover border-transparent hover:border-card-border"
                                  )}
                                >
                                   <div className={clsx(
                                     "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all",
                                     isSelected ? badge.bgColor + " " + badge.color + " border-primary/20" : "bg-card border-card-border text-text-tertiary"
                                   )}>
                                      <Icon className="w-5 h-5" />
                                   </div>
                                   <span className={clsx("text-[9px] font-black uppercase text-center leading-tight", isSelected ? "text-primary" : "text-text-tertiary")}>
                                     {badge.label}
                                   </span>
                                </button>
                              );
                            })}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Reason / Commendation</label>
                         <textarea 
                           placeholder="Tell them why they're awesome..."
                           value={reason}
                           onChange={(e) => setReason(e.target.value)}
                           className="w-full bg-card-hover border-2 border-transparent rounded-2xl py-5 px-6 min-h-[120px] text-text-primary font-medium focus:border-primary focus:bg-card transition-all outline-none resize-none"
                         />
                      </div>
                   </div>
                </div>

                {/* Summary & Submit Column */}
                <div className="space-y-8">
                   <div className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-xl space-y-8 sticky top-10">
                      <h3 className="text-xl font-black text-text-primary tracking-tight">Reward Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-card-border">
                           <span className="text-xs font-bold text-text-tertiary">Recipients</span>
                           <span className="text-xs font-black text-text-primary bg-card-hover px-3 py-1 rounded-full border border-card-border">{selectedStudents.length} Students</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-card-border">
                           <span className="text-xs font-bold text-text-tertiary">Total Coins</span>
                           <span className="text-xs font-black text-amber-500 flex items-center gap-1"><Coins className="w-3 h-3" /> {(coins * selectedStudents.length).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-card-border">
                           <span className="text-xs font-bold text-text-tertiary">Total XP</span>
                           <span className="text-xs font-black text-indigo-500 flex items-center gap-1"><Zap className="w-3 h-3" /> {(xp * selectedStudents.length).toLocaleString()}</span>
                        </div>
                        {selectedBadge && (
                          <div className="flex justify-between items-center py-3 border-b border-card-border animate-in slide-in-from-top-2">
                             <span className="text-xs font-bold text-text-tertiary">Badge</span>
                             <div className={clsx("flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", selectedBadge.bgColor, selectedBadge.color, selectedBadge.borderColor)}>
                                {selectedBadge.label}
                             </div>
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-[10px] font-black uppercase tracking-wider animate-pulse">
                           <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                      )}

                      <div className="flex gap-3">
                         <button 
                           onClick={() => setStep(2)}
                           className="flex-1 py-4 rounded-2xl text-text-tertiary font-black uppercase tracking-widest text-[10px] hover:bg-card-hover transition-all"
                         >
                            Back
                         </button>
                         <button 
                           onClick={handleReward}
                           disabled={isSubmitting}
                           className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Rewarding...
                              </>
                            ) : (
                              <>
                                <Trophy className="w-4 h-4" /> Send Rewards
                              </>
                            )}
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
