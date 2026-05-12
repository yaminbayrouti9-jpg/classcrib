"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, BookOpen, Search, Leaf, Dumbbell, Sparkles, ClipboardList, Clock, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import SubmitWorkModal from "./SubmitWorkModal";

export default function TaskList({ initialTasks, initialSubmissions = [] }: { initialTasks: any[], initialSubmissions?: any[] }) {
  const [mainTab, setMainTab] = useState("Todo");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSubmission = (taskId: string) => initialSubmissions.find(s => s.task.toString() === taskId || s.task?._id?.toString() === taskId);
  
  const isSubmitted = (taskId: string) => {
    const s = getSubmission(taskId);
    return s && (s.status === 'Pending' || s.status === 'Approved');
  };

  const filteredTasks = initialTasks.filter(task => {
    const statusMatch = mainTab === "Todo" ? !isSubmitted(task._id.toString()) : isSubmitted(task._id.toString());
    const categoryMatch = categoryFilter === "All" || task.type === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const formatDate = (dateString: string) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Main Tabs */}
      <div className="flex gap-1 bg-card-hover p-1 rounded-xl w-fit border border-card-border shadow-sm">
         {["Todo", "Done"].map(tab => (
           <button 
             key={tab} 
             onClick={() => { setMainTab(tab); setCategoryFilter("All"); }}
             className={clsx(
               "px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
               mainTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-tertiary hover:text-text-primary"
             )}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Category Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap gap-2">
          {["All", "Homework", "Green", "Physical"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCategoryFilter(tab)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                categoryFilter === tab ? "bg-primary/10 border-primary/30 text-primary shadow-sm" : "bg-card border-card-border text-text-secondary hover:border-text-tertiary hover:bg-card-hover"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80 group">
           <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
           <input 
             type="text" 
             placeholder="Search assignments..." 
             className="w-full pl-11 pr-4 py-3 bg-card border border-card-border rounded-2xl text-sm text-text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-tertiary" 
           />
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task._id.toString()} className={clsx(
            "bento-card flex flex-col justify-between group h-full transition-all duration-500",
            mainTab === "Done" && "opacity-75"
          )}>
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border",
                  task.type === "Homework" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  task.type === "Green" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  {task.type === "Homework" && <BookOpen className="w-6 h-6" />}
                  {task.type === "Green" && <Leaf className="w-6 h-6" />}
                  {task.type === "Physical" && <Dumbbell className="w-6 h-6" />}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card-hover rounded-xl border border-card-border text-[10px] font-black text-text-secondary uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                    {formatDate(task.dueDate)}
                  </div>
                  <div className={clsx(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                    task.difficulty === "Hard" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                    task.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {task.difficulty || "Medium"}
                  </div>
                </div>
              </div>

              <h4 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors leading-tight mb-3">{task.title}</h4>
              <p className="text-xs text-text-secondary line-clamp-2 mb-6 font-medium leading-relaxed">{task.description || "No description provided."}</p>
            </div>

            <div className="pt-6 border-t border-card-border mt-auto flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1.5 bg-amber-500/10 rounded-lg text-[10px] font-black text-amber-500 border border-amber-500/20 shadow-sm">
                    +{task.coins} CC
                  </div>
                  <div className="px-2.5 py-1.5 bg-primary/10 rounded-lg text-[10px] font-black text-primary border border-primary/20 shadow-sm">
                    +{task.xp} XP
                  </div>
               </div>
               
               {mainTab === "Done" ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Done
                  </div>
               ) : (
                  <button 
                    onClick={() => setSelectedTask(task)}
                    className="text-primary font-black text-xs flex items-center gap-1.5 hover:gap-2.5 transition-all group/btn"
                  >
                    Submit Work <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
               )}
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-24 text-center bg-card-hover/50 rounded-[2.5rem] border-2 border-dashed border-card-border animate-fade-in">
             <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-card-border">
                <ClipboardList className="w-10 h-10 text-text-tertiary opacity-30" />
             </div>
             <p className="text-text-primary font-black text-xl">No tasks found</p>
             <p className="text-text-tertiary text-sm mt-2 font-medium">Check another category or search filter</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <SubmitWorkModal 
          taskId={selectedTask._id.toString()} 
          taskTitle={selectedTask.title}
          existingSubmission={getSubmission(selectedTask._id.toString())}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

