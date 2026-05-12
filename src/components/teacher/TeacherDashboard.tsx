"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  Activity, 
  Clock, 
  Zap,
  ChevronRight,
  CheckCircle2,
  BarChart2,
  Trophy,
  Award,
  Printer,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomizableDashboard from "../dashboard/CustomizableDashboard";
import CertificateModal from "../student/CertificateModal";

interface TeacherDashboardProps {
  userRecord: any;
  workspaces: any[];
  pendingVerifications: number;
  avgCompletion: string;
  recentActivity: any[];
  topStudents: any[];
  activityPulse: number[];
  growthData?: any[];
  studentTrend?: string;
  completionTrend?: string;
  verificationTrend?: string;
  engagementRate?: string;
  engagementTrend?: string;
}

export default function TeacherDashboard({ 
  userRecord, 
  workspaces, 
  pendingVerifications, 
  avgCompletion,
  recentActivity,
  topStudents,
  activityPulse,
  growthData = [],
  studentTrend = "+0% this month",
  completionTrend = "+0% vs last week",
  verificationTrend = "+0 since yesterday",
  engagementRate = "0%",
  engagementTrend = "Calculating..."
}: TeacherDashboardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [certificateUser, setCertificateUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || "Failed to create workspace");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityData = React.useMemo(() => {
    if (!mounted) return activityPulse.map((count, i) => ({ day: '', count: 0 }));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    return activityPulse.map((count, i) => {
      const dayIndex = (today - 6 + i + 7) % 7;
      return { day: days[dayIndex], count };
    });
  }, [mounted, activityPulse]);

  const dashboardData = {
    activityPulse: activityData,
    topStudents: topStudents.map(s => ({
      username: s.username,
      level: s.level || 1,
      xp: s.xp || 0,
      role: 'Scholar'
    })),
    deadlines: recentActivity.map(a => ({
      title: `${a.student?.username}: ${a.task?.title}`,
      dueIn: 'Pending Review',
      urgent: true
    })),
    communityActivity: recentActivity.map(a => ({
      user: a.student?.username,
      action: `submitted ${a.task?.title}`,
      time: 'Recently'
    })),
    growthData: growthData
  };

  const defaultLayout: any[] = [
    { id: 'activity_pulse', type: 'activity_pulse', size: 'lg' },
    { id: 'leaderboard', type: 'leaderboard', size: 'md' },
    { id: 'community_pulse', type: 'community_pulse', size: 'md' },
    { id: 'deadline_radar', type: 'deadline_radar', size: 'md' },
    { id: 'quick_notes', type: 'quick_notes', size: 'sm' },
    { id: 'growth_chart', type: 'growth_chart', size: 'md' },
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 animate-fade-in pb-24">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
            Admin <span className="text-primary">Console</span>
          </h1>
          <p className="text-text-secondary font-medium">Monitoring student performance and workspace activity.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-card-border p-2 rounded-2xl shadow-sm">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input 
                type="text" 
                placeholder="Search workspaces..." 
                className="bg-background border-none text-xs font-bold py-2.5 pl-10 pr-4 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all w-64 text-text-primary placeholder:text-text-tertiary"
              />
           </div>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
           >
              <Plus className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Students" value={workspaces.reduce((acc, ws) => acc + (ws.students?.length || 0), 0)} icon={Users} trend={studentTrend} color="indigo" />
        <KPICard label="Avg. Completion" value={avgCompletion} icon={Activity} trend={completionTrend} color="emerald" />
        <KPICard label="Pending Verifications" value={pendingVerifications} icon={Clock} trend={verificationTrend} color="amber" highlight />
        <KPICard label="Engagement Rate" value={engagementRate} icon={Zap} trend={engagementTrend} color="rose" />
      </div>

      {/* Customizable Dashboard Grid */}
      <CustomizableDashboard initialLayout={defaultLayout} data={dashboardData} userRole="Teacher" />

      {/* Awards & Certificates Section */}
      <div className="bento-card border-primary/20 bg-primary/5">
         <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
               <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                 <Award className="w-6 h-6 text-primary" /> Awards & Certificates
               </h3>
               <p className="text-xs text-text-secondary font-medium">Generate printable achievement certificates for your top students.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topStudents.map((student, index) => (
              <div key={student._id} className="p-6 bg-card border border-card-border rounded-2xl flex flex-col gap-4 group hover:border-primary transition-all">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xl">
                      {student.username[0]}
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Rank #{index + 1}</p>
                      <p className="text-lg font-black text-text-primary">@{student.username}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-secondary">
                   <span>{student.xp?.toLocaleString()} XP</span>
                   <span>Level {student.level || 1}</span>
                </div>
                <button 
                  onClick={() => setCertificateUser({ ...student, rank: index + 1 })}
                  className="w-full py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  <Printer className="w-4 h-4" /> Print Certificate
                </button>
              </div>
            ))}
            {topStudents.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-tertiary font-bold uppercase tracking-widest text-xs italic">
                No students found in your classes yet.
              </div>
            )}
         </div>
      </div>

      {/* Workspace Management Table */}
      <div className="bento-card overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">Workspace Management</h3>
              <p className="text-xs text-text-secondary font-medium">Active classes and enrollment status</p>
           </div>
           <button className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group">
              Manage All Workspaces <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-card-border">
                <th className="pb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Workspace Name</th>
                <th className="pb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Students</th>
                <th className="pb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Activity</th>
                <th className="pb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Invite Code</th>
                <th className="pb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {workspaces.map((ws: any) => (
                <tr key={ws._id} className="group hover:bg-background/50 transition-colors cursor-pointer" onClick={() => router.push(`/classes/${ws._id}`)}>
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold border border-primary/20">
                          {ws.name[0]}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-text-primary">{ws.name}</p>
                          <p className="text-[10px] text-text-tertiary">Created {new Date(ws.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex -space-x-2">
                       {ws.students?.length > 0 ? (
                         <>
                           {ws.students.slice(0, 4).map((s: any, i: number) => (
                             <div key={s._id || i} className="w-7 h-7 rounded-full border-2 border-card bg-card-hover flex items-center justify-center text-[8px] font-bold text-text-tertiary uppercase">
                                {s.username?.[0] || 'U'}
                             </div>
                           ))}
                           {ws.students.length > 4 && (
                             <div className="w-7 h-7 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                                +{ws.students.length - 4}
                             </div>
                           )}
                         </>
                       ) : (
                         <span className="text-[10px] text-text-tertiary font-medium">No students</span>
                       )}
                    </div>
                  </td>
                  <td className="py-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                       <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <code className="bg-card-hover text-primary px-2.5 py-1 rounded-lg text-[10px] font-black border border-primary/20 shadow-sm uppercase tracking-widest">
                        {ws.inviteCode}
                      </code>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <Link href={`/classes/${ws._id}`} className="text-xs font-bold text-text-tertiary hover:text-primary transition-colors">View Workspace</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60">
           <div className="bg-card border border-card-border rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-text-primary tracking-tight">Create New Class</h2>
                 <p className="text-sm text-text-tertiary font-medium">Students will use an invite code to join.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateWorkspace(); }} className="space-y-8">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Class Name</label>
                      <input 
                        type="text" 
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="e.g. Advanced Mathematics" 
                        className="w-full bg-card-hover border border-card-border rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none caret-primary"
                        autoFocus
                      />
                      {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-wider animate-pulse">{error}</p>}
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                     type="button"
                     onClick={() => setShowCreateModal(false)}
                     className="flex-1 py-4 rounded-2xl text-text-tertiary font-black uppercase tracking-widest text-[10px] hover:bg-card-hover transition-all"
                   >
                      Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={isSubmitting || !newWorkspaceName.trim()}
                     className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                      {isSubmitting ? 'Creating...' : 'Create Workspace'}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {certificateUser && (
        <CertificateModal 
          userName={certificateUser.username}
          rank={certificateUser.rank}
          xp={certificateUser.xp}
          onClose={() => setCertificateUser(null)}
        />
      )}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, trend, color, highlight }: { label: string, value: any, icon: any, trend: string, color: string, highlight?: boolean }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div className="p-6 bg-card rounded-3xl border border-card-border shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[color] || colorMap.indigo}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{label}</p>
        <h3 className="text-3xl font-extrabold text-text-primary tracking-tight">{value}</h3>
        <p className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
           {trend}
        </p>
      </div>
    </div>
  );
}
