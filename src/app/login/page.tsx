"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, BookOpen, Star, ShieldCheck, CheckCircle, Wallet } from "lucide-react";
import "@/app/auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container p-6 overflow-y-auto">
      <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-5 gap-0 bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 min-h-[700px]">
        
        {/* Sidebar Info (Matching Signup Style) */}
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
                   "Access your personalized dashboard",
                   "Manage your academic records",
                   "Stay connected with the community",
                   "Monitor real-time system stats"
                 ].map((feature, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center">
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
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                   <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                   <p className="text-xs font-black text-academy-navy uppercase tracking-widest">Academy Status</p>
                   <p className="text-sm font-bold text-text-secondary italic">Verified Education Portal</p>
                </div>
             </div>
          </div>
          
          {/* Subtle Background Pattern */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Form Side */}
        <div className="lg:col-span-3 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em]">
                 <ShieldCheck className="w-3 h-3" /> Secure Access
              </div>
              <h3 className="text-3xl font-black text-academy-navy tracking-tighter">Portal Access</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                      placeholder="e.g. explorer_123"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Security Key</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="academic-input input-with-icon"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
                   <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-academy-navy text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-academy-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Access Crib <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <div className="pt-6 border-t border-gray-100">
               <p className="text-center text-text-secondary font-bold">
                 New student here?{" "}
                 <Link href="/signup" className="text-academy-navy font-black hover:underline underline-offset-4 decoration-primary decoration-4">
                   Register Enrollment
                 </Link>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
