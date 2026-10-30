"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2, Sparkles, UserPlus, CheckCircle, ShieldCheck } from "lucide-react";
import "@/app/auth.css";

export default function SignupPage() {
  const [accountType, setAccountType] = useState<"student" | "school">("student");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(accountType === "school" ? "/api/school/signup" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountType === "school"
          ? { schoolName, contactEmail, username, displayName, password }
          : { username, displayName, password, role: "Student", dob }),
      });

      if (res.ok) {
        if (accountType === "school") {
          setError("");
          setMessage("School request submitted for ClassCrib operations review. The school administrator account will be created only if the request is approved. Outcome emails are sent when email delivery is configured.");
        } else {
          router.push("/login");
        }
      } else {
        const data = await res.json();
        setError(data.message || data.error || "Registration failed. Try a different username.");
      }
    } catch {
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
                 <UserPlus className="w-3 h-3" /> Create an account
              </div>
              <h3 className="text-3xl font-black text-academy-navy tracking-tighter">
                {accountType === "student" ? "Student enrollment" : "School registration"}
              </h3>
            </div>

            <form onSubmit={handleSignup} className="space-y-8">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
                <button
                  type="button"
                  onClick={() => { setAccountType("student"); setError(""); setMessage(""); }}
                  className={`rounded-xl px-3 py-3 text-sm font-black transition-colors ${accountType === "student" ? "bg-white text-academy-navy shadow-sm" : "text-text-secondary"}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => { setAccountType("school"); setError(""); setMessage(""); }}
                  className={`rounded-xl px-3 py-3 text-sm font-black transition-colors ${accountType === "school" ? "bg-white text-academy-navy shadow-sm" : "text-text-secondary"}`}
                >
                  School
                </button>
              </div>

              {accountType === "school" ? (
                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-text-secondary">
                  Submit your school details for review by the ClassCrib operations team. A school administrator account is created only after approval.
                </div>
              ) : (
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-text-secondary">
                  Student accounts are created here. Ask your school administrator for teacher or school access.
                </p>
              )}

              <div className="space-y-4">
                {accountType === "school" && (
                  <>
                    <div>
                      <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-widest text-academy-navy">School name</label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(event) => setSchoolName(event.target.value)}
                        className="academic-input"
                        placeholder="Your school"
                        maxLength={150}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-widest text-academy-navy">School contact email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        className="academic-input"
                        placeholder="you@school.example"
                        maxLength={254}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">
                    {accountType === "student" ? "Name shown to your teachers" : "School administrator name"}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="academic-input"
                    placeholder={accountType === "student" ? "Your name" : "Your full name"}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Username</label>
                  <div className="relative group">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="academic-input input-with-icon"
                      placeholder={accountType === "student" ? "Choose a cool username" : "Choose an administrator username"}
                      minLength={3}
                      maxLength={32}
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
                      placeholder={accountType === "school" ? "At least 12 characters" : "Create a strong key"}
                      minLength={accountType === "school" ? 12 : 10}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {accountType === "student" && <div className="animate-in slide-in-from-top-2">
                  <label className="block text-xs font-black text-academy-navy uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                  <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-academy-navy transition-colors" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="academic-input input-with-icon"
                      required
                    />
                  </div>
                  <p className="text-[10px] font-bold text-text-tertiary mt-2 ml-1">Needed to personalize your experience</p>
                </div>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-bold animate-shake">
                   {error}
                </div>
              )}
              {message && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || Boolean(message)}
                className="w-full h-16 bg-academy-navy text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-academy-navy/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{accountType === "student" ? "Enroll Now" : "Submit school request"} <ArrowRight className="w-5 h-5" /></>}
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
