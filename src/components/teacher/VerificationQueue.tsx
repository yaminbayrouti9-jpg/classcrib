"use client";

import { useState } from "react";
import { Clock, CheckCircle, ChevronRight, User, BookOpen, Calendar, Search } from "lucide-react";
import VerificationModal from "./VerificationModal";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationQueue({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubmissions = initialSubmissions.filter(sub => 
    sub.student?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.task?.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h3 className="text-2xl font-black text-text-primary flex items-center gap-3 tracking-tight">
          <Clock className="w-6 h-6 text-primary" /> Verification Inbox
        </h3>
        
        <div className="relative w-full md:w-96 group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by student or task..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-card border border-card-border rounded-2xl text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-tertiary shadow-inner" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((sub: any, index: number) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                key={sub._id.toString()} 
                className="bg-card border border-card-border rounded-[2rem] p-5 md:p-6 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-card-hover flex items-center justify-center text-text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-card-border shrink-0">
                    {sub.student?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <p className="font-black text-text-primary text-base tracking-tight truncate">@{sub.student?.username}</p>
                       <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase tracking-widest border border-primary/20">
                          Lvl {sub.student?.level || 1}
                       </span>
                    </div>
                    <p className="text-xs font-bold text-text-secondary line-clamp-1">{sub.task?.title}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto">
                  <div className="space-y-3 md:text-right">
                    <div className="flex items-center md:justify-end gap-2 text-text-tertiary">
                       <BookOpen className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{sub.task?.class?.name || 'Unknown Class'}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-2 text-text-tertiary">
                       <Calendar className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold text-[9px] font-black rounded-full border border-accent-gold/20 tracking-widest">
                           {sub.proofType.toUpperCase()} PROOF
                        </span>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-card-hover border border-card-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                        <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-white group-hover:translate-x-1 transition-all" />
                     </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center space-y-6 bg-card-hover/20 rounded-[3rem] border-2 border-dashed border-card-border"
            >
               <div className="w-24 h-24 bg-card rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-card-border">
                  <CheckCircle className="w-12 h-12 text-emerald-500/30" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black text-text-primary tracking-tight">Queue Clear!</h4>
                  <p className="text-sm font-bold text-text-secondary max-w-xs mx-auto">No pending submissions found. Great job staying on top of your work!</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedSubmission && (
        <VerificationModal 
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onSuccess={() => {
            setSelectedSubmission(null);
            // In a real app, we might re-fetch or filter out the verified one locally
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
