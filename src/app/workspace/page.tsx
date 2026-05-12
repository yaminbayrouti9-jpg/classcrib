import { 
  Users, 
  Plus, 
  BookOpen, 
  Activity, 
  ClipboardList, 
  Settings,
  MoreHorizontal,
  Mail,
  Zap
} from "lucide-react";
import { clsx } from "clsx";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Workspace from "@/models/Workspace";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Task from "@/models/Task";
import AddStudentForm from "@/components/teacher/AddStudentForm";
import VerificationQueue from "@/components/teacher/VerificationQueue";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  const teacherId = (session?.user as any)?.id;
  
  // Real data fetching
  const workspaces = await Workspace.find({ teacher: teacherId }).lean();
  
  // Fetch pending submissions across all workspaces
  const pendingSubmissions = await Submission.find({ 
    status: 'Pending',
    workspace: { $in: workspaces.map(w => w._id) }
  })
  .populate('student task')
  .sort({ createdAt: -1 })
  .lean();

  // Fetch all students belonging to teacher's workspaces
  const students = await User.find({ 
    role: 'Student',
    workspaces: { $in: workspaces.map(w => w._id) }
  }).lean();

  const totalTasks = await Task.countDocuments({ creator: teacherId });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-8 animate-fade-in pb-32">
      {/* Header Bento Card */}
      <div className="bento-card bg-text-primary text-white border-none py-10 px-12 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-text-primary/10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Workspace Manager</h1>
          <p className="text-white/60 font-medium max-w-md">Create workspaces, invite students, and verify assignments to grow your class community.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn bg-white/10 hover:bg-white/20 text-white border-white/10">Settings</button>
          <button className="btn bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 h-14 px-8">
            <Plus className="w-5 h-5" /> Create Workspace
          </button>
        </div>
      </div>

      {/* Main Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Statistics Column */}
        <div className="lg:col-span-3 space-y-6">
           <StatsCard label="Active Students" value={students.length} sub="Across all groups" icon={Users} color="text-blue-500" />
           <StatsCard label="Assignments" value={totalTasks} sub="Total published" icon={ClipboardList} color="text-purple-500" />
           <StatsCard label="Verified This Week" value="12" sub="+14% increase" icon={Activity} color="text-green-500" />
        </div>

        {/* Workspace & Students Column */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-8">
           <div className="bento-card">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-text-primary tracking-tight">Your Workspaces</h3>
                 <button className="text-xs font-black text-primary uppercase tracking-widest">Manage All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {workspaces.map((w: any) => (
                    <div key={w._id.toString()} className="p-6 rounded-[28px] border border-gray-100 hover:border-primary/30 hover:bg-gray-50/50 transition-all group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <BookOpen className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md">{w.inviteCode}</p>
                       </div>
                       <h4 className="text-lg font-bold text-text-primary mb-1">{w.name}</h4>
                       <p className="text-xs font-bold text-text-secondary mb-4">{w.students?.length || 0} Students enrolled</p>
                       <div className="flex justify-between text-[10px] font-black uppercase text-text-secondary tracking-widest pt-4 border-t border-gray-100">
                          <span>Efficiency</span>
                          <span className="text-green-500">88%</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Student List Bento */}
           <div className="bento-card">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-text-primary tracking-tight">Active Students</h3>
                 <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-3" />
                   <span className="text-xs font-bold text-text-secondary">{students.length} Online</span>
                 </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {students.map((stu: any) => (
                    <div key={stu._id.toString()} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-50">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                             {stu.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-text-primary">@{stu.username}</p>
                             <p className="text-[10px] font-bold text-text-secondary uppercase">Level {stu.level || 1} • {stu.coins || 0} Coins</p>
                          </div>
                       </div>
                       <button className="p-2 text-gray-300 hover:text-text-primary transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Verification & Control Column */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-8">
           <VerificationQueue initialSubmissions={pendingSubmissions} />
           
           <AddStudentForm workspaceId={workspaces[0]?._id?.toString() || ""} />

           <div className="bento-card bg-accent-gold/5 border-accent-gold/20 flex flex-col items-center justify-center text-center p-12">
              <Zap className="w-12 h-12 text-accent-gold mb-4" />
              <h4 className="text-lg font-black text-text-primary mb-2">Premium Analytics</h4>
              <p className="text-xs font-bold text-text-secondary leading-relaxed">Upgrade to see detailed learning velocity and behavioral patterns.</p>
              <button className="mt-6 text-xs text-orange-600 font-bold hover:underline">Learn more →</button>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatsCard({ label, value, sub, icon: Icon, color }: any) {
   return (
      <div className="bento-card group hover:bg-primary hover:border-primary transition-all duration-500">
         <div className={clsx("w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 transition-all group-hover:bg-white/20 group-hover:text-white", color)}>
            <Icon className="w-6 h-6" />
         </div>
         <h3 className="text-4xl font-black text-text-primary group-hover:text-white transition-colors tracking-tighter">{value}</h3>
         <p className="text-sm font-bold text-text-primary group-hover:text-white/90 transition-colors mt-1">{label}</p>
         <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-4 group-hover:text-white/50 transition-colors">{sub}</p>
      </div>
   );
}
