"use client";

import { 
  Settings, 
  Palette, 
  Moon, 
  Sun, 
  Stars,
  User,
  Shield,
  Bell,
  Lock,
  ChevronRight,
  Check,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

const themes = [
  { id: "light", name: "Light Mode", icon: Sun, color: "bg-white", text: "text-slate-900" },
  { id: "dark", name: "Dark Mode", icon: Moon, color: "bg-slate-900", text: "text-white" },
  { id: "midnight", name: "Midnight", icon: Stars, color: "bg-slate-950", text: "text-violet-400" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "notifications" | "privacy" | "security">("profile");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [privateMode, setPrivateMode] = useState(false);
  const [theme, setTheme] = useState("light");

  // Notifications toggles
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);

  // Privacy toggles
  const [allowSearch, setAllowSearch] = useState(true);

  // Security (Passwords)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status message
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success && data.profile) {
        const prof = data.profile;
        setUsername(prof.username || "");
        setRole(prof.role || "");
        setEmail(prof.email || "");
        setParentEmail(prof.parentEmail || "");
        setPrivateMode(prof.privateMode || false);

        // Nested preferences settings
        const s = prof.settings || {};
        const localTheme = localStorage.getItem("classcrib-theme") || "light";
        setTheme(s.theme || localTheme);
        setWeeklyEmail(s.weeklyEmail !== undefined ? s.weeklyEmail : true);
        setTaskReminders(s.taskReminders !== undefined ? s.taskReminders : true);
        setStreakAlerts(s.streakAlerts !== undefined ? s.streakAlerts : true);
        setAllowSearch(s.allowSearch !== undefined ? s.allowSearch : true);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    setMounted(true);
  }, []);

  const handleThemeChange = async (themeId: string) => {
    setTheme(themeId);
    localStorage.setItem("classcrib-theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    
    // Save theme preference immediately to db
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { theme: themeId } }),
      });
    } catch (err) {
      console.error("Failed to save theme setting:", err);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (activeTab === "security") {
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setMessage({ text: "Please fill in all password fields.", type: "error" });
          return;
        }
        if (newPassword !== confirmPassword) {
          setMessage({ text: "New passwords do not match.", type: "error" });
          return;
        }
        if (newPassword.length < 6) {
          setMessage({ text: "New password must be at least 6 characters.", type: "error" });
          return;
        }
      } else {
        setMessage({ text: "Please fill in password fields to update password.", type: "error" });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload: any = {
        email,
        parentEmail,
        privateMode,
        settings: {
          theme,
          weeklyEmail,
          taskReminders,
          streakAlerts,
          allowSearch
        }
      };

      if (activeTab === "security" && currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (data.profile) {
          setEmail(data.profile.email || "");
          setParentEmail(data.profile.parentEmail || "");
          setPrivateMode(data.profile.privateMode || false);
        }
      } else {
        setMessage({ text: data.error || "Failed to save settings.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleReset = () => {
    fetchProfile();
    setMessage({ text: "Settings reset to saved values.", type: "success" });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 md:p-10 animate-fade-in pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-secondary font-medium text-lg">Manage your experience and preferences.</p>
      </div>

      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-text-tertiary font-black uppercase tracking-widest">Loading Preferences...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="space-y-1">
             <SidebarItem icon={User} label="Profile" active={activeTab === "profile"} onClick={() => { setActiveTab("profile"); setMessage(null); }} />
             <SidebarItem icon={Palette} label="Appearance" active={activeTab === "appearance"} onClick={() => { setActiveTab("appearance"); setMessage(null); }} />
             <SidebarItem icon={Bell} label="Notifications" active={activeTab === "notifications"} onClick={() => { setActiveTab("notifications"); setMessage(null); }} />
             <SidebarItem icon={Shield} label="Privacy" active={activeTab === "privacy"} onClick={() => { setActiveTab("privacy"); setMessage(null); }} />
             <SidebarItem icon={Lock} label="Security" active={activeTab === "security"} onClick={() => { setActiveTab("security"); setMessage(null); }} />
          </div>

          {/* Settings Content */}
          <div className="md:col-span-2 space-y-8">
             
             {/* Profile tab content */}
             {activeTab === "profile" && (
               <div className="bento-card space-y-6">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
                       <User className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-text-primary">Profile Defaults</h3>
                       <p className="text-xs text-text-tertiary font-medium">Control your public presence and emails.</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Username</label>
                       <input 
                         type="text" 
                         disabled
                         value={username} 
                         className="w-full p-4 rounded-2xl border border-card-border bg-card-hover text-text-secondary font-bold cursor-not-allowed outline-none" 
                       />
                       <p className="text-[10px] text-text-tertiary font-medium mt-1.5 ml-1">Account role: {role}</p>
                    </div>

                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Email Address</label>
                       <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your-email@example.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-card-border bg-card-hover focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-text-primary" 
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Parent's Email Address</label>
                       <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                          <input 
                            type="email" 
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            placeholder="parent-email@example.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-card-border bg-card-hover focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-text-primary" 
                          />
                       </div>
                       <p className="text-[10px] text-text-tertiary font-medium mt-1.5 ml-1">Weekly automated progress reports will be sent here.</p>
                    </div>
                 </div>
               </div>
             )}

             {/* Appearance Section */}
             {activeTab === "appearance" && (
               <div className="bento-card">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
                        <Palette className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-text-primary">Appearance</h3>
                        <p className="text-xs text-text-tertiary font-medium">Choose how ClassCrib looks for you.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {themes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          className={clsx(
                            "relative p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 text-left group",
                            theme === t.id 
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                              : "border-card-border bg-card-hover hover:border-text-tertiary hover:bg-card"
                          )}
                        >
                           <div className={clsx("w-full h-16 rounded-xl mb-1 shadow-inner border border-card-border/50 flex items-center justify-center overflow-hidden", t.color)}>
                              <t.icon className={clsx("w-6 h-6", t.text)} />
                           </div>
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[11px] font-black uppercase tracking-tight text-text-primary">{t.name}</span>
                              {theme === t.id && (
                                <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                                   <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
             )}

             {/* Notifications Section */}
             {activeTab === "notifications" && (
               <div className="bento-card space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-sm">
                        <Bell className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-text-primary">Notification Settings</h3>
                        <p className="text-xs text-text-tertiary font-medium">Configure alert triggers and subscriptions.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-5 bg-card-hover rounded-2xl border border-card-border group hover:bg-card transition-all">
                        <div>
                           <p className="text-sm font-bold text-text-primary">Weekly summaries to parents</p>
                           <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest mt-1">Sends progress overview to parental email</p>
                        </div>
                        <Switch checked={weeklyEmail} onChange={setWeeklyEmail} />
                     </div>

                     <div className="flex items-center justify-between p-5 bg-card-hover rounded-2xl border border-card-border group hover:bg-card transition-all">
                        <div>
                           <p className="text-sm font-bold text-text-primary">Assignment graded alerts</p>
                           <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest mt-1">Get notified inside platform when homework is graded</p>
                        </div>
                        <Switch checked={taskReminders} onChange={setTaskReminders} />
                     </div>

                     <div className="flex items-center justify-between p-5 bg-card-hover rounded-2xl border border-card-border group hover:bg-card transition-all">
                        <div>
                           <p className="text-sm font-bold text-text-primary">Daily streak alerts</p>
                           <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest mt-1">Reminders to maintain your green and study streak</p>
                        </div>
                        <Switch checked={streakAlerts} onChange={setStreakAlerts} />
                     </div>
                  </div>
               </div>
             )}

             {/* Privacy Section */}
             {activeTab === "privacy" && (
               <div className="bento-card space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-sm">
                        <Shield className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-text-primary">Privacy Defaults</h3>
                        <p className="text-xs text-text-tertiary font-medium">Control what data other players can see.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-5 bg-card-hover rounded-2xl border border-card-border group hover:bg-card transition-all">
                        <div>
                           <p className="text-sm font-bold text-text-primary">Private Mode</p>
                           <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest mt-1">Hide your XP and ranks from leaderboard rankings</p>
                        </div>
                        <Switch checked={privateMode} onChange={setPrivateMode} />
                     </div>

                     <div className="flex items-center justify-between p-5 bg-card-hover rounded-2xl border border-card-border group hover:bg-card transition-all">
                        <div>
                           <p className="text-sm font-bold text-text-primary">Allow Classroom Search</p>
                           <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest mt-1">Classmates can find you to send gifts and join teams</p>
                        </div>
                        <Switch checked={allowSearch} onChange={setAllowSearch} />
                     </div>
                  </div>
               </div>
             )}

             {/* Security Section */}
             {activeTab === "security" && (
               <div className="bento-card space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-sm">
                        <Lock className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-text-primary">Security</h3>
                        <p className="text-xs text-text-tertiary font-medium">Manage your security credentials.</p>
                     </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Current Password</label>
                       <div className="relative group">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                          <input 
                            type={showCurrentPass ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-card-border bg-card-hover focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-text-primary" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                          >
                            {showCurrentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">New Password</label>
                       <div className="relative group">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                          <input 
                            type={showNewPass ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password (min 6 chars)"
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-card-border bg-card-hover focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-text-primary" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                          >
                            {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                       <div className="relative group">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                          <input 
                            type={showNewPass ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-card-border bg-card-hover focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-text-primary" 
                          />
                       </div>
                    </div>

                  </div>
               </div>
             )}

             {/* Feedback alerts */}
             {message && (
               <div className={clsx(
                 "p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in-50 slide-in-from-bottom-5",
                 message.type === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
               )}>
                 {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 <span>{message.text}</span>
               </div>
             )}

             {/* Action footer */}
             <div className="flex justify-end gap-3">
                <button 
                  onClick={handleReset}
                  className="px-6 py-3 rounded-2xl text-text-tertiary font-black uppercase tracking-widest text-[10px] hover:bg-card-hover transition-all"
                >
                  Reset to Saved
                </button>
                <button 
                  onClick={() => handleSaveAll()}
                  disabled={saving}
                  className="px-10 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all group text-left",
        active ? "bg-primary/10 text-primary font-black shadow-sm" : "text-text-tertiary hover:bg-card-hover hover:text-text-primary font-bold"
      )}
    >
       <Icon className={clsx("w-5 h-5", active ? "text-primary" : "text-text-tertiary group-hover:text-text-secondary")} />
       <span className="text-sm">{label}</span>
       {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function Switch({ checked, onChange, disabled = false }: { checked: boolean, onChange: (val: boolean) => void, disabled?: boolean }) {
  return (
    <div 
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        "w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 border p-1 flex items-center flex-shrink-0",
        disabled ? "opacity-40 cursor-not-allowed bg-card-border border-card-border" : 
        checked ? "bg-primary border-primary" : "bg-card-border border-card-border"
      )}
    >
      <div className={clsx(
        "w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 shadow-sm",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </div>
  );
}
