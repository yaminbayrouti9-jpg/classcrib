"use client";

import { 
  Sparkles, 
  Zap,
  Leaf,
  Trophy,
  Medal,
  Plus,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import CustomizableDashboard from "../dashboard/CustomizableDashboard";
import CribbyTip from "../ai/CribbyTip";
import TutorialOverlay from "./TutorialOverlay";
import { getBadgeIcon } from "@/lib/badges";


interface StudentDashboardProps {
  userRecord: any;
  tasks: any[];
  userName: string;
  topStudents?: any[];
  personalPulse?: number[];
  neighborhoodActivity?: any[];
  growthData?: any[];
}

export default function StudentDashboard({ 
  userRecord, 
  tasks, 
  userName, 
  topStudents = [], 
  personalPulse = [0,0,0,0,0,0,0], 
  neighborhoodActivity = [],
  growthData = []
}: StudentDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [showTutorial, setShowTutorial] = useState(!userRecord?.hasCompletedTutorial);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).showJoinModal = () => setShowJoinModal(true);
    }
  }, []);

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    setError("");
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/classes";
      } else {
        setError(data.error || "Failed to join class");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCompleteTutorial = async () => {
    setShowTutorial(false);
    try {
      await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "completeTutorial" })
      });
    } catch (err) {
      console.error("Failed to mark tutorial as complete:", err);
    }
  };

  const recentTransactions = userRecord?.recentTransactions || [];
  const incomeTotal = recentTransactions
    .filter((t: any) => t.type === 'Income')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const expenseTotal = recentTransactions
    .filter((t: any) => t.type === 'Expense')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);

  const activityData = useEffect !== undefined ? personalPulse.map((count, i) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = mounted ? new Date().getDay() : 0;
    const dayIndex = (today - 6 + i + 7) % 7;
    return { day: days[dayIndex], count };
  }) : [];

  const defaultLayout: any[] = [
    { id: 'home_preview', type: 'home_preview', size: 'lg' },
    { id: 'activity_pulse', type: 'activity_pulse', size: 'lg' },
    { id: 'daily_quests', type: 'daily_quests', size: 'md' },
    { id: 'wealth_insight', type: 'wealth_insight', size: 'md' },
    { id: 'leaderboard', type: 'leaderboard', size: 'md' },
    { id: 'deadline_radar', type: 'deadline_radar', size: 'md' },
    { id: 'eco_impact', type: 'eco_impact', size: 'sm' },
    { id: 'focus_timer', type: 'focus_timer', size: 'sm' },
  ];

  const dashboardData = {
    activityPulse: activityData,
    balance: userRecord?.coins || 0,
    income: incomeTotal,
    expense: expenseTotal,
    ecoXp: userRecord?.xp || 0,
    ecoLevel: userRecord?.level || 1,
    homeLevel: userRecord?.homeLevel || 1,
    purchasedItems: userRecord?.purchasedItems || [],
    interiorLayout: userRecord?.interiorLayout || {},
    topStudents: topStudents,
    quests: (userRecord?.currentChallenge || []).map((c: any) => ({
      title: c.title || c.description,
      completed: c.status === 'Completed' || c.completed,
      reward: c.reward || 50
    })),
    buddyStatus: "Online",
    badges: (userRecord?.badges?.length > 0) 
      ? userRecord.badges.map((b: any) => ({ icon: getBadgeIcon(b.icon), label: b.label, color: b.color }))
      : [
          { icon: Zap, label: 'Fast Learner', color: 'text-amber-500' },
          { icon: Leaf, label: 'Eco Warrior', color: 'text-emerald-500' },
          { icon: Trophy, label: 'Top Scorer', color: 'text-indigo-500' },
        ],
    deadlines: tasks.map(t => ({
      title: t.title,
      dueIn: new Date(t.dueDate).toLocaleDateString(),
      urgent: new Date(t.dueDate).getTime() - Date.now() < 86400000
    })),
    communityActivity: neighborhoodActivity,
    growthData: growthData
  };


  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8 animate-fade-in pb-24">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-card-border p-8 md:p-12 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors duration-1000" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center lg:text-left">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full w-fit mx-auto lg:mx-0 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
              <Sparkles className="w-3 h-3" /> Season 1: Foundations
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter leading-tight">
                Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">{userRecord?.username || userName}!</span> 
              </h1>
              <p className="text-text-secondary font-medium text-lg">Your progress is looking <span className="text-emerald-500 font-bold">excellent</span> today.</p>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              <div className="flex items-center gap-3 px-5 py-3 bg-card-hover rounded-2xl border border-card-border shadow-sm">
                <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-lg border border-amber-500/20">🔥</div>
                <div>
                   <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-1">Streak</p>
                   <p className="text-lg font-black text-text-primary leading-none">{userRecord?.streak || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-card-hover rounded-2xl border border-card-border shadow-sm">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                   <Medal className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-1">Global Rank</p>
                   <p className="text-lg font-black text-text-primary leading-none">#{userRecord?.rank || '?'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
             <CribbyTip />
          </div>
        </div>
      </div>

      {/* Customizable Dashboard Grid */}
      <CustomizableDashboard initialLayout={defaultLayout} data={dashboardData} userRole="Student" />

      {/* Tutorial Overlay */}
      {showTutorial && <TutorialOverlay onComplete={handleCompleteTutorial} />}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60">
           <div className="bg-card border border-card-border rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="space-y-2 text-center">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
                    <Users className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-black text-text-primary tracking-tight">Join a Class</h2>
                 <p className="text-sm text-text-tertiary font-medium px-4">Enter the 6-character code provided by your teacher.</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <input 
                      type="text" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="CODE123" 
                      className="w-full bg-card border-2 border-card-border rounded-2xl py-5 px-6 text-2xl font-black text-center tracking-[0.5em] text-text-primary focus:border-primary focus:ring-0 transition-all outline-none placeholder:text-text-tertiary/20 caret-primary shadow-inner"
                    />
                    {error && <p className="text-[10px] font-bold text-rose-500 text-center uppercase tracking-wider animate-pulse">{error}</p>}
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowJoinModal(false)}
                   className="flex-1 py-4 rounded-2xl text-text-tertiary font-black uppercase tracking-widest text-[10px] hover:bg-card-hover transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleJoinClass}
                   disabled={isJoining || inviteCode.length < 6}
                   className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                 >
                    {isJoining ? 'Joining...' : 'Confirm Join'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
