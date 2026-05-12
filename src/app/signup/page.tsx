"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, ArrowRight, Loader2, Sparkles, UserPlus, CheckCircle, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import "@/app/auth.css";

export default function SignupPage() {
  const [role, setRole] = useState<"Student" | "Teacher">("Student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, dob: role === 'Student' ? dob : undefined }),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed. Try a different username.");
      }
    } catch (err) {
      setError("Unable to process enrollment. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container p-6 overflow-y-auto">
      <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-5 gap-0 bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 min-h-[700px]">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-2 bg-[#f1f5f9] p-12 flex flex-col justify-between relative overflow-hidden border-r border-gray-100">
          <div className="relative z-10 space-y-12">
            <div className="flex items-center gap-3">
               <img src="/logo.png" alt="Logo" className="w-12 h-12" />
               <h1 className="text-2xl font-black text-academy-navy tracking-tighter">ClassCrib</h1>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-black text-academy-navy leading-tight tracking-tighter">
                Earn. Learn. <span className="text-purple-600 italic">Grow.</span>
              </h2>
              <div className="space-y-4">
                 {[
                   "Earn coins through academic tasks",
                   "Build and upgrade your virtual home",
                   "Compete in global leaderboards",
                   "Save the planet in the Eco-Hub"
                 ].map((feature, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                         <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-text-secondary">{feature}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm mt-12">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                   <Sparkles className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-black text-academy-navy uppercase tracking-widest">Enrollment status</p>
                   <p className="text-sm font-bold text-text-secondary italic">Waiting for your entry...</p>
                </div>
             </div>
          </div>
          
          {/* Subtle Background Pattern */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Form Side */}
        <div className="lg:col-span-3 p-12">
          <div className="max-w-md mx-auto space-y-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em]">
                 <UserPlus className="w-3 h-3" /> Registration Open
              </div>
              <h3 className="text-3xl font-black text-academy-navy tracking-tighter">Create Account</h3>
            </div>

            <form onSubmit={handleSignup} className="space-y-8">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-academy-navy uppercase tracking-widest ml-1">Select Identity</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setRole("Student")}
                    className={clsx("role-card", role === "Student" && "active")}
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                      role === "Student" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-100 text-text-tertiary"
                    )}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-black text-sm text-academy-navy">Student</span>
                    <span className="text-[10px] font-bold text-text-tertiary mt-1">Earn & Learn</span>
                  </div>
                  <div 
                    onClick={() => setRole("Teacher")}
                    className={clsx("role-card", role === "Teacher" && "active")}
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                      role === "Teacher" ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "bg-gray-100 text-text-tertiary"
                    )}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="font-black text-sm text-academy-navy">Teacher</span>
                    <span className="text-[10px] font-bold text-text-tertiary mt-1">Manage & Verify</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Username</label>
                  <div className="relative group">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="academic-input input-with-icon"
                      placeholder="Choose a cool username"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="academic-input input-with-icon"
                      placeholder="Create a strong key"
                      required
                    />
                  </div>
                </div>

                {role === "Student" && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                    <div className="relative group">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="academic-input input-with-icon"
                        required={role === "Student"}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-text-tertiary mt-2 ml-1">Needed to personalize your experience</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-bold animate-shake">
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-academy-navy text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-academy-navy/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Enroll Now <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <div className="pt-6 border-t border-gray-100">
               <p className="text-center text-text-secondary font-bold">
                 Already enrolled?{" "}
                 <Link href="/login" className="text-academy-navy font-black hover:underline underline-offset-4 decoration-primary decoration-4">
                   Return to Class
                 </Link>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
