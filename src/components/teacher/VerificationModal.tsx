"use client";

import { useState } from "react";
import { Check, X, Loader2, Link as LinkIcon, FileText, User, MessageCircle, Download, File, ExternalLink, Maximize2, ShieldCheck, AlertTriangle, Sparkles, Coins, Zap } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationModalProps {
  submission: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationModal({ submission, onClose, onSuccess }: VerificationModalProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleVerify = async (status: 'Approved' | 'Rejected') => {
    setLoading(status);
    try {
      const res = await fetch("/api/teacher/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          submissionId: submission._id, 
          status, 
          feedback 
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setLoading(null);
    }
  };

  const isImage = (content: string) => content?.startsWith('data:image/');
  const isPDF = (content: string) => content?.startsWith('data:application/pdf');

  return (
    <div className="fixed top-[80px] left-0 md:left-64 right-0 bottom-0 z-[100] bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="h-full w-full flex flex-col bg-card border-l border-card-border shadow-2xl"
      >
        {/* Header - Even Smaller */}
        <div className="px-6 py-3 border-b border-card-border bg-card-hover/20 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/10">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-black text-text-primary tracking-tight">Review Assignment</h3>
                 <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Student: <span className="text-primary">@{submission.student?.username}</span></p>
                    <span className="w-0.5 h-0.5 rounded-full bg-card-border" />
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Class: <span className="text-text-primary">{submission.task?.class?.name || 'General'}</span></p>
                 </div>
              </div>
           </div>
           <button 
             onClick={onClose} 
             className="w-8 h-8 flex items-center justify-center hover:bg-card-hover rounded-lg text-text-tertiary hover:text-primary transition-all group"
           >
             <X className="w-4 h-4 group-hover:rotate-90 transition-all duration-300" />
           </button>
        </div>

        {/* Content Area - Tighter padding and scaling */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6">
          <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
             
             {/* Left Column: Submission Content */}
             <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                   <h4 className="text-[8px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 opacity-60">
                      <Sparkles className="w-2.5 h-2.5 text-primary" /> Submission Proof
                   </h4>
                   {submission.proofType === 'file' && (
                      <a 
                        href={submission.content} 
                        download={submission.fileName || "submission"}
                        className="flex items-center gap-1.5 text-[8px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                         <Download className="w-3 h-3" /> Download
                      </a>
                   )}
                </div>

                <div className="bg-background rounded-2xl border border-card-border p-3 flex flex-col flex-1 shadow-inner min-h-[450px]">
                   <div className="flex items-center gap-2 mb-3 px-2.5 py-1 bg-card rounded-full border border-card-border w-fit">
                      {submission.proofType === 'text' ? <FileText className="w-3 h-3 text-primary" /> : submission.proofType === 'link' ? <LinkIcon className="w-3 h-3 text-primary" /> : <File className="w-3 h-3 text-primary" />}
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-primary">
                        {submission.fileName ? submission.fileName : submission.proofType.toUpperCase()}
                      </span>
                   </div>

                   <div className="flex-1 rounded-xl overflow-hidden bg-card border border-card-border shadow-lg flex flex-col relative group">
                      {submission.proofType === 'link' ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                           <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                              <ExternalLink className="w-6 h-6" />
                           </div>
                           <div className="space-y-1">
                             <p className="text-sm font-black text-text-primary">{submission.task?.title}</p>
                             <p className="text-[10px] font-bold text-text-secondary max-w-xs mx-auto break-all bg-card-hover p-2 rounded-lg">{submission.content}</p>
                           </div>
                           <a 
                             href={submission.content.startsWith('http') ? submission.content : `https://${submission.content}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="px-6 py-2.5 bg-primary text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all"
                           >
                             Open Link
                           </a>
                        </div>
                      ) : isImage(submission.content) ? (
                        <div className="relative h-full flex items-center justify-center p-2 flex-1">
                           <img 
                             src={submission.content} 
                             alt="Student proof" 
                             className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                           />
                           <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none rounded-lg">
                              <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white font-black text-[8px] uppercase tracking-widest">
                                Original
                              </div>
                           </div>
                        </div>
                      ) : isPDF(submission.content) ? (
                        <iframe src={submission.content} className="w-full h-full border-none flex-1" title="PDF Preview" />
                      ) : (
                        <div className="p-6 text-sm font-bold text-text-primary leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto no-scrollbar">
                           {submission.content}
                        </div>
                      )}
                   </div>
                </div>

                {submission.note && (
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                     <div className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-primary shadow-sm shrink-0">
                        <MessageCircle className="w-4 h-4" />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest">Note</p>
                        <p className="text-xs font-bold text-text-primary italic leading-relaxed">"{submission.note}"</p>
                     </div>
                  </div>
                )}
             </div>

             {/* Right Column: Feedback & Verification - More Compact */}
             <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 flex-1">
                   <label className="text-[8px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1 opacity-60">
                      <FileText className="w-3 h-3" /> Feedback
                   </label>
                   <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full flex-1 p-5 rounded-2xl border border-card-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-xs text-text-primary resize-none placeholder:text-text-tertiary shadow-inner"
                      placeholder="Type feedback..."
                   />
                </div>

                <div className="bg-card-hover/40 p-5 rounded-[2rem] border border-card-border space-y-5">
                   <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Rewards</p>
                      <div className="flex gap-2">
                         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-gold/10 text-accent-gold rounded-lg border border-accent-gold/20 font-black text-[9px] tracking-widest">
                            <Coins className="w-3.5 h-3.5" /> +{submission.task?.coins}
                         </div>
                         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 font-black text-[9px] tracking-widest">
                            <Zap className="w-3.5 h-3.5" /> +{submission.task?.xp}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-2.5">
                      <button 
                         onClick={() => handleVerify('Approved')}
                         disabled={!!loading}
                         className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                         {loading === 'Approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                               <Check className="w-4 h-4" /> Approve
                            </>
                         )}
                      </button>
                      <button 
                        onClick={() => handleVerify('Rejected')}
                        disabled={!!loading}
                        className="w-full py-2.5 bg-card hover:bg-rose-500/5 text-rose-500 border border-card-border rounded-xl font-black text-[8px] uppercase tracking-widest transition-all hover:border-rose-500/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                         {loading === 'Rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                               <AlertTriangle className="w-3.5 h-3.5" /> Reject
                            </>
                         )}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
