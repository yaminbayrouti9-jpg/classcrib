"use client";

import { useState } from "react";
import { User, Mail, Shield, Bell, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [parentEmail, setParentEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    // Mock save logic
    setTimeout(() => {
      setSaving(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold text-text-primary">Profile Settings</h2>
        <p className="text-text-secondary mt-2">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="glass p-8 flex flex-col items-center text-center space-y-4 h-fit">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">{session?.user?.name}</h3>
            <p className="text-sm font-bold text-primary uppercase">@{(session?.user as any)?.role}</p>
          </div>
          <div className="w-full pt-4 border-t border-gray-50 flex justify-around">
            <div>
              <p className="text-lg font-bold text-text-primary">1.2k</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Coins</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">Lvl 5</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Rank</p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 space-y-6">
            <h4 className="text-xl font-bold text-text-primary flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" /> Security & Privacy
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Username</label>
                <input 
                  type="text" 
                  disabled
                  value={session?.user?.name || ""} 
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 text-text-secondary font-medium cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Parent's Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input 
                    type="email" 
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium" 
                  />
                </div>
                <p className="text-xs text-text-secondary mt-2">Required for weekly automated summary emails.</p>
              </div>
            </div>

            {message && <p className="text-green-500 font-bold text-center text-sm">{message}</p>}

            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary w-full h-14"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>

          <div className="glass p-8 space-y-6">
            <h4 className="text-xl font-bold text-text-primary flex items-center gap-3">
              <Bell className="w-6 h-6 text-accent-mint" /> Notifications
            </h4>
            <div className="space-y-4">
               <ToggleItem label="Email weekly summaries to parents" defaultChecked />
               <ToggleItem label="Task reminders (Browser)" defaultChecked />
               <ToggleItem label="Streak alerts" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, defaultChecked = false }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-text-primary">{label}</span>
      <div className={clsx(
        "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
        defaultChecked ? "bg-primary" : "bg-gray-200"
      )}>
        <div className={clsx(
          "w-4 h-4 rounded-full bg-white transition-transform",
          defaultChecked ? "translate-x-6" : "translate-x-0"
        )} />
      </div>
    </div>
  );
}
