"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  Settings,
  ArrowRight,
  Shield,
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function ClassesPage() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);

  const role = (session?.user as any)?.role || "Student";

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewClassName("");
        fetchClasses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      });
      if (res.ok) {
        setShowJoinModal(false);
        setInviteCode("");
        fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      if (res.ok) fetchClasses();
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text-primary tracking-tighter">My Classes</h1>
        </div>
        
        <div className="flex gap-4">
          {role === 'Teacher' ? (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-white rounded-2xl flex items-center gap-3 py-3 px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all font-bold"
            >
              <Plus className="w-5 h-5" /> Create Class
            </button>
          ) : (
            <button 
              onClick={() => setShowJoinModal(true)}
              className="bg-primary text-white rounded-2xl flex items-center gap-3 py-3 px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all font-bold"
            >
              <Plus className="w-5 h-5" /> Join Class
            </button>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
          <div className="w-24 h-24 bg-card-hover rounded-[2rem] flex items-center justify-center border border-card-border">
            <Users className="w-10 h-10 text-text-tertiary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-text-primary">No classes yet</h3>
            <p className="text-text-tertiary max-w-xs mx-auto">
              {role === 'Teacher' ? 'Create your first class to start managing assignments and posts.' : 'Join a class using an invite code from your teacher.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {classes.map((cls) => (
            <Link key={cls._id} href={`/classes/${cls._id}`} className="group">
              <motion.div 
                whileHover={{ y: -8 }}
                className="bg-card border border-card-border rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all h-full flex flex-col"
              >
                <div className="h-32 relative bg-card-hover group-hover:opacity-90 transition-opacity">
                  {cls.banner ? (
                    <img 
                      src={cls.banner} 
                      className="w-full h-full object-cover" 
                      alt={cls.name} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cls.name)}&background=random&size=800`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: cls.color || '#4F46E5' }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute -bottom-10 left-8 w-20 h-20 bg-card rounded-3xl border-4 border-card shadow-2xl flex items-center justify-center font-black text-3xl text-text-primary group-hover:scale-110 transition-transform">
                    {cls.name.charAt(0)}
                  </div>
                </div>
                
                <div className="p-8 pt-12 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-text-primary tracking-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                    {role === 'Teacher' && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClass(cls._id);
                        }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card-hover rounded-full text-[9px] font-black uppercase tracking-widest text-text-tertiary border border-card-border">
                      <BookOpen className="w-3 h-3" /> {role === 'Teacher' ? `${cls.students?.length || 0} Students` : 'General'}
                    </div>
                    {cls.settings?.allowStudentPosts && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/5 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/10">
                        <MessageSquare className="w-3 h-3" /> Chat On
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-6 border-t border-card-border flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary group-hover:text-primary transition-colors">Enter Workspace</span>
                     <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-2 transition-transform group-hover:text-primary" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-card-border rounded-[3rem] shadow-2xl w-full max-w-md p-10 space-y-8"
          >
            <div className="space-y-2 text-center">
               <h3 className="text-3xl font-black text-text-primary tracking-tighter">New Class</h3>
               <p className="text-text-tertiary font-medium">Create a workspace for your students.</p>
            </div>
            
            <form onSubmit={handleCreateClass} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-tertiary ml-1">Class Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-2xl px-6 py-4 text-sm font-bold text-text-primary focus:border-primary transition-all outline-none caret-primary shadow-inner"
                    placeholder="e.g. Advanced Physics - Section B"
                  />
               </div>
               <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-card-border font-black text-xs uppercase tracking-widest hover:bg-card-hover transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Now'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-card-border rounded-[3rem] shadow-2xl w-full max-w-md p-10 space-y-8"
          >
            <div className="space-y-2 text-center">
               <h3 className="text-3xl font-black text-text-primary tracking-tighter">Join Class</h3>
               <p className="text-text-tertiary font-medium">Enter the 6-character code from your teacher.</p>
            </div>
            
            <form onSubmit={handleJoinClass} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-tertiary ml-1">Invite Code</label>
                  <input 
                    autoFocus
                    type="text" 
                    required
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-card border border-card-border rounded-2xl px-6 py-4 text-2xl font-black text-center tracking-[0.5em] text-text-primary focus:border-primary transition-all outline-none caret-primary shadow-inner"
                    placeholder="XXXXXX"
                  />
               </div>
               <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-card-border font-black text-xs uppercase tracking-widest hover:bg-card-hover transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Join Now'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
