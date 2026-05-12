"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardPlus, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Coins,
  Zap,
  Calendar,
  Layers,
  FileText,
  Target,
  X,
  Plus
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

interface Workspace {
  _id: string;
  name: string;
}

interface CreateTaskFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function CreateTaskForm({ onSuccess, onClose }: CreateTaskFormProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Homework",
    coins: 100,
    xp: 50,
    dueDate: "",
    workspaceId: ""
  });

  useEffect(() => {
    console.log("Fetching teacher classes...");
    fetch("/api/classes")
      .then(res => res.json())
      .then(data => {
        console.log("Teacher classes data:", data);
        if (data.classes) {
          setWorkspaces(data.classes);
          if (data.classes.length > 0) {
            setFormData(prev => ({ ...prev, workspaceId: data.classes[0]._id }));
          }
        }
      })
      .catch(err => console.error("Error fetching classes:", err))
      .finally(() => setFetchingClasses(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/teacher/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: "Assignment published successfully!" });
        setFormData({
          ...formData,
          title: "",
          description: "",
          dueDate: ""
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to create task" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "A network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-[2rem] border border-card-border shadow-2xl overflow-hidden max-w-lg w-full mx-auto animate-scale-in flex flex-col max-h-[85vh]">
      <div className="p-5 border-b border-card-border bg-card-hover/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ClipboardPlus className="w-5 h-5" />
          </div>
          <div>
             <h3 className="text-base font-black text-text-primary tracking-tight">New Assignment</h3>
             <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">Draft a task</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-card-hover rounded-lg text-text-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto no-scrollbar">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
               <FileText className="w-3 h-3 text-primary" /> Title
            </label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary placeholder:text-text-tertiary shadow-inner"
              placeholder="e.g. Vocabulary Quiz"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
               <FileText className="w-3 h-3 text-primary" /> Instructions
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary resize-none placeholder:text-text-tertiary shadow-inner"
              placeholder="Detailed instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                 <Layers className="w-3 h-3 text-primary" /> Type
              </label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-black text-xs text-text-primary"
              >
                 <option value="Homework">Homework</option>
                 <option value="Green">Green</option>
                 <option value="Physical">Physical</option>
                 <option value="Activity">Activity</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                 <Calendar className="w-3 h-3 text-primary" /> Due Date
              </label>
              <input 
                type="date" 
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-black text-xs text-text-primary uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                   <Coins className="w-3 h-3 text-accent-gold" /> Coins
                </label>
                <input 
                  type="number" 
                  required
                  value={formData.coins}
                  onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                   <Zap className="w-3 h-3 text-indigo-500" /> XP
                </label>
                <input 
                  type="number" 
                  required
                  value={formData.xp}
                  onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary"
                />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
               <Target className="w-3 h-3 text-primary" /> Target Class
            </label>
            {fetchingClasses ? (
              <div className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-card-hover flex items-center gap-2">
                 <Loader2 className="w-3 h-3 animate-spin text-primary" />
                 <span className="text-[8px] text-text-tertiary font-black uppercase tracking-widest">Loading...</span>
              </div>
            ) : (
            <div className="relative">
              {workspaces.length > 0 ? (
                <select 
                  value={formData.workspaceId}
                  onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background hover:bg-card-hover focus:border-primary outline-none transition-all font-bold text-sm text-text-primary cursor-pointer shadow-sm"
                >
                  {workspaces.map(ws => (
                    <option key={ws._id} value={ws._id} className="bg-card text-text-primary">{ws.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-card-border bg-card-hover/20 text-center space-y-2">
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">No classes found</p>
                  <Link href="/classes" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Create your first class
                  </Link>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {message && (
          <div className={clsx(
            "p-3 rounded-xl flex items-start gap-3 animate-scale-in border",
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          )}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
            <div className="text-[9px] font-black uppercase tracking-widest leading-tight">{message.text}</div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || workspaces.length === 0}
          className="w-full bg-primary hover:shadow-lg text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] text-[9px] uppercase tracking-widest shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <ClipboardPlus className="w-4 h-4" /> Publish
            </>
          )}
        </button>
      </form>
    </div>
  );
}

