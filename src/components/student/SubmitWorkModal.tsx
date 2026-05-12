"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Link as LinkIcon, FileText, Loader2, CheckCircle, File, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface SubmitWorkModalProps {
  taskId: string;
  taskTitle: string;
  existingSubmission?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitWorkModal({ taskId, taskTitle, existingSubmission, onClose, onSuccess }: SubmitWorkModalProps) {
  const [proofType, setProofType] = useState<'text' | 'link' | 'file'>(existingSubmission?.proofType || 'text');
  const [content, setContent] = useState(existingSubmission?.content || "");
  const [fileName, setFileName] = useState(existingSubmission?.fileName || "");
  const [note, setNote] = useState(existingSubmission?.note || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync with existing submission if it changes
  useEffect(() => {
    if (existingSubmission) {
      setProofType(existingSubmission.proofType);
      setContent(existingSubmission.content);
      setFileName(existingSubmission.fileName || "");
      setNote(existingSubmission.note || "");
    }
  }, [existingSubmission]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId, 
          proofType, 
          content, 
          note,
          fileName: fileName || undefined
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bento-card max-w-md w-full text-center space-y-4 animate-scale-in">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-text-primary">All Done!</h3>
          <p className="text-text-secondary font-medium">Your work has been submitted. Your teacher will verify it soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-card-border rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-lg w-full relative animate-scale-in flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-text-tertiary hover:text-text-primary z-10 p-2 hover:bg-card-hover rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
           <h3 className="text-xl font-black text-text-primary tracking-tight">Turn In Work</h3>
           <p className="text-text-secondary font-bold text-xs">{taskTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 no-scrollbar">
           <div className="flex gap-4">
              <ProofTab active={proofType === 'text'} onClick={() => setProofType('text')} icon={FileText} label="Note" />
              <ProofTab active={proofType === 'link'} onClick={() => setProofType('link')} icon={LinkIcon} label="Link" />
              <ProofTab active={proofType === 'file'} onClick={() => setProofType('file')} icon={Upload} label="File" />
           </div>

           <div>
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3">
                 {proofType === 'text' ? 'Write your response' : proofType === 'link' ? 'Paste your link' : 'Upload your work'}
              </label>
              
              {proofType === 'file' ? (
                 <div 
                   {...getRootProps()}
                   className={clsx(
                     "border-4 border-dashed rounded-3xl p-10 text-center transition-all group cursor-pointer",
                     isDragActive ? "border-primary bg-primary/5" : "border-card-border bg-card-hover/30 hover:border-primary/30"
                   )}
                 >
                    <input {...getInputProps()} />
                    {fileName ? (
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                             <File className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-black text-primary uppercase tracking-tight">Selected: {fileName}</p>
                          <p className="text-[10px] text-text-tertiary font-bold">Click or drag to replace</p>
                       </div>
                    ) : (
                       <>
                          <Upload className={clsx(
                            "w-10 h-10 mx-auto mb-4 transition-colors text-text-tertiary group-hover:text-primary",
                            isDragActive && "text-primary"
                          )} />
                          <p className="text-sm font-bold text-text-secondary">
                             {isDragActive ? "Drop the file here..." : "Drag and drop or click to upload"}
                          </p>
                          <p className="text-[10px] text-text-tertiary mt-2 font-bold uppercase tracking-widest">Supports Images & PDFs</p>
                       </>
                    )}
                 </div>
              ) : (
                <textarea 
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={proofType === 'link' ? 'https://docs.google.com/...' : 'Explain your work here...'}
                  className="w-full p-5 rounded-[20px] border border-card-border bg-background text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm placeholder:text-text-tertiary shadow-inner"
                />
              )}
           </div>

           <div>
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3">Add a note for teacher (Optional)</label>
              <input 
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you'd like to say?"
                className="w-full p-4 rounded-2xl border border-card-border bg-background text-text-primary focus:border-primary outline-none transition-all font-medium text-sm placeholder:text-text-tertiary"
              />
           </div>

           {existingSubmission && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] font-bold text-amber-600 uppercase tracking-widest animate-pulse">
                 <AlertCircle className="w-4 h-4" /> Editing a previously rejected submission
              </div>
           )}

           <div className="pt-4 flex gap-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1 py-4 h-14 rounded-2xl">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-[2] py-4 h-14 rounded-2xl shadow-xl shadow-primary/20">
                 {loading ? <Loader2 className="animate-spin" /> : 'Turn In Now'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}

function ProofTab({ active, onClick, icon: Icon, label }: any) {
   return (
      <button 
        type="button"
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${active ? 'border-primary bg-primary/10' : 'border-card-border bg-card-hover/30 hover:bg-card-hover opacity-50 hover:opacity-100'}`}
      >
         <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-text-tertiary'}`} />
         <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-primary' : 'text-text-tertiary'}`}>{label}</span>
      </button>
   );
}
