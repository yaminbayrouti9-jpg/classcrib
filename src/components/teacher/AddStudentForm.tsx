"use client";

import { useState } from "react";
import { UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface AddStudentFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export default function AddStudentForm({ workspaceId, onSuccess }: AddStudentFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, workspaceId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Student @${username} created successfully!` });
        setUsername("");
        setPassword("");
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to create student" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "A network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bento-card bg-gray-50/50 border-gray-100">
      <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-primary" /> Register New Student
      </h3>
      <p className="text-xs text-text-secondary font-medium mb-6">Create an account for your workspace.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Student Username</label>
          <input 
            type="text" 
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 rounded-2xl border border-gray-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm"
            placeholder="e.g. alex_j"
          />
        </div>

        <div>
           <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Account Password</label>
           <input 
             type="password" 
             required
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             className="w-full p-4 rounded-2xl border border-gray-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm"
             placeholder="••••••••"
           />
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-xs font-bold">{message.text}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn btn-primary py-4 shadow-lg shadow-primary/20 h-14"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Authorize & Create Account"}
        </button>
      </form>
    </div>
  );
}
