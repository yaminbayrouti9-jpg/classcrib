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
  Monitor,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

const themes = [
  { id: "light", name: "Light Mode", icon: Sun, color: "bg-white", text: "text-slate-900" },
  { id: "dark", name: "Dark Mode", icon: Moon, color: "bg-slate-900", text: "text-white" },
  { id: "midnight", name: "Midnight", icon: Stars, color: "bg-slate-950", text: "text-violet-400" },
];

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("classcrib-theme") || "light";
    setCurrentTheme(savedTheme);
    setMounted(true);
  }, []);

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("classcrib-theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 md:p-10 animate-fade-in pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-secondary font-medium text-lg">Manage your experience and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-1">
           <SidebarItem icon={User} label="Profile" active />
           <SidebarItem icon={Palette} label="Appearance" />
           <SidebarItem icon={Bell} label="Notifications" />
           <SidebarItem icon={Shield} label="Privacy" />
           <SidebarItem icon={Lock} label="Security" />
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-8">
           
           {/* Appearance Section */}
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
                 {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => changeTheme(theme.id)}
                      className={clsx(
                        "relative p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 text-left group",
                        currentTheme === theme.id 
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                          : "border-card-border bg-card-hover hover:border-text-tertiary hover:bg-card"
                      )}
                    >
                       <div className={clsx("w-full h-16 rounded-xl mb-1 shadow-inner border border-card-border/50 flex items-center justify-center overflow-hidden", theme.color)}>
                          <theme.icon className={clsx("w-6 h-6", theme.text)} />
                       </div>
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase tracking-tight text-text-primary">{theme.name}</span>
                          {currentTheme === theme.id && (
                            <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                               <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                       </div>
                    </button>
                 ))}
              </div>
           </div>

           {/* Profile Section */}
           <div className="bento-card">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-sm">
                    <User className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-text-primary">Profile Defaults</h3>
                    <p className="text-xs text-text-tertiary font-medium">Control your public presence.</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-5 bg-card-hover rounded-[2rem] border border-card-border group hover:bg-card transition-all">
                    <div>
                       <p className="text-sm font-bold text-text-primary">Private Mode</p>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-0.5">Hide your XP and ranks from others</p>
                    </div>
                    <div className="w-11 h-6 bg-card-border rounded-full relative cursor-pointer border border-card-border">
                       <div className="absolute left-1 top-1 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-5 bg-card-hover rounded-[2rem] border border-card-border opacity-50">
                    <div>
                       <p className="text-sm font-bold text-text-primary">Email Updates</p>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-0.5">Receive weekly progress reports</p>
                    </div>
                    <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                       <div className="absolute right-1 top-1 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3">
              <button className="px-6 py-3 rounded-2xl text-text-tertiary font-black uppercase tracking-widest text-[10px] hover:bg-card-hover transition-all">Reset to Defaults</button>
              <button className="px-10 py-3 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all">Save Changes</button>
           </div>

        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={clsx(
      "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all group",
      active ? "bg-primary/10 text-primary font-black shadow-sm" : "text-text-tertiary hover:bg-card-hover hover:text-text-primary font-bold"
    )}>
       <Icon className={clsx("w-5 h-5", active ? "text-primary" : "text-text-tertiary group-hover:text-text-secondary")} />
       <span className="text-sm">{label}</span>
       {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}
