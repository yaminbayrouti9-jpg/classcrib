"use client";

import { 
  Sparkles, 
  Clock, 
  Brain, 
  Calendar,
  Lock,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function AIPlannerPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 animate-fade-in pb-32">
      <div className="flex items-center gap-4 mb-6">
         <Link href="/tasks" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
         </Link>
         <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Sparkles className="w-3 h-3" /> Experimental Feature
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
         <div className="space-y-6">
            <h1 className="text-6xl font-black text-text-primary tracking-tighter leading-tight">
               AI Study <span className="text-primary italic">Planner</span>
            </h1>
            <p className="text-text-secondary font-bold text-xl leading-relaxed">
               Revolutionize your productivity with a dynamic timeline that adapts to your energy levels, priorities, and deadlines.
            </p>
            
            <div className="space-y-4 pt-6">
               <FeatureRow icon={Brain} title="Energy-Aware Slots" description="Automatically schedules Deep Work when your focus is peak." />
               <FeatureRow icon={Clock} title="Deadline Mitigation" description="Identifies risks and shifts tasks to avoid late submissions." />
               <FeatureRow icon={Calendar} title="Social-Sync" description="Blocks time for collaborative study sessions with neighbors." />
            </div>
         </div>

         <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative glass p-10 rounded-[40px] border-white/40 shadow-2xl flex flex-col items-center text-center space-y-8 overflow-hidden grayscale opacity-80 cursor-not-allowed">
               <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center overflow-hidden border border-primary/10">
                  <img src="/cribby-critical.png" alt="Cribby" className="w-full h-full object-contain" />
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-3xl font-black text-text-primary">Under Construction</h3>
                  <p className="text-text-secondary font-bold">Cribby is training the algorithm. Check back later!</p>
               </div>

               <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/30 w-1/3 rounded-full" />
               </div>

               <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary shadow-sm">
                  <Lock className="w-4 h-4" /> Locked
               </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary opacity-10 rounded-full blur-2xl" />
         </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
   return (
      <div className="flex gap-4">
         <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
         </div>
         <div>
            <h4 className="font-black text-text-primary">{title}</h4>
            <p className="text-sm text-text-secondary font-medium">{description}</p>
         </div>
      </div>
   );
}
