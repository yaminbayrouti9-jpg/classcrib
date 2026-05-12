"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  ClipboardList, 
  FileText, 
  MoreHorizontal, 
  Send, 
  Plus, 
  Settings,
  ChevronLeft,
  Loader2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function ClassWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'posts' | 'assignments' | 'settings' | 'students'>('posts');
  const [searchUsername, setSearchUsername] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addError, setAddError] = useState("");
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'posts') {
      scrollToBottom();
    }
  }, [classData?.posts, activeTab]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/classes/${id}`);
      const data = await res.json();
      if (data.class) {
        setClassData(data.class);
        setAssignments(data.assignments);
        setIsTeacher(data.isTeacher);
      } else {
        router.push('/classes');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost })
      });
      if (res.ok) {
        setNewPost("");
        fetchDetails(); // Refresh posts
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setIsAddingStudent(true);
    setAddError("");
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: searchUsername.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchUsername("");
        fetchDetails();
      } else {
        setAddError(data.error || "Failed to add student");
      }
    } catch (err) {
      setAddError("An unexpected error occurred");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const togglePermission = async (key: string, value: boolean) => {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [key]: value } })
      });
      if (res.ok) {
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student from the class?")) return;
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-hidden">
      {/* Top Navigation Bar (Teams Style) */}
      <header className="h-16 bg-card border-b border-card-border flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/classes" className="p-2 hover:bg-card-hover rounded-full transition-colors text-text-tertiary hover:text-primary">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg" style={{ backgroundColor: classData.color }}>
                {classData.name.charAt(0)}
             </div>
             <div>
                <h1 className="text-lg font-black text-text-primary leading-none">{classData.name}</h1>
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-1">General Channel</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center px-3 py-1.5 bg-card-hover rounded-full border border-card-border gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{classData.students?.length || 0} Online</span>
           </div>
           <button className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
              <MoreHorizontal className="w-6 h-6" />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Sidebar Tabs */}
        <aside className="w-20 md:w-64 bg-card border-r border-card-border flex flex-col shrink-0">
           <div className="p-4 space-y-2">
              <TabButton 
                active={activeTab === 'posts'} 
                onClick={() => setActiveTab('posts')} 
                icon={MessageSquare} 
                label="Posts" 
              />
              <TabButton 
                active={activeTab === 'assignments'} 
                onClick={() => setActiveTab('assignments')} 
                icon={ClipboardList} 
                label="Assignments" 
              />
              <TabButton 
                active={activeTab === 'students'} 
                onClick={() => setActiveTab('students')} 
                icon={Users} 
                label="Students" 
              />
              <TabButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={Settings} 
                label="Settings" 
              />
           </div>
           
           <div className="mt-auto p-6 border-t border-card-border">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {classData.teacher?.username?.charAt(0) || 'T'}
                 </div>
                 <div className="hidden md:block overflow-hidden">
                    <p className="text-xs font-black text-text-primary truncate">{classData.teacher?.username}</p>
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Instructor</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background-alt overflow-hidden">
           <AnimatePresence mode="wait">
              {activeTab === 'posts' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden h-full"
                >
                   {/* Messages Feed */}
                   <div ref={feedRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                      {classData.posts?.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-4">
                           <MessageSquare className="w-16 h-16" />
                           <p>No messages in this channel yet.</p>
                        </div>
                      ) : (
                        classData.posts.map((post: any, i: number) => (
                          <div key={i} className="flex gap-4 group">
                             <div className={clsx(
                               "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm shadow-sm",
                               post.role === 'Teacher' ? "bg-primary text-white" : "bg-card border border-card-border text-text-secondary"
                             )}>
                                {post.authorName?.charAt(0)}
                             </div>
                             <div className="space-y-1.5 flex-1 max-w-4xl">
                                <div className="flex items-center gap-3">
                                   <span className="text-sm font-black text-text-primary">{post.authorName}</span>
                                   <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
                                      {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                   {post.role === 'Teacher' && (
                                     <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded uppercase border border-primary/20">Teacher</span>
                                   )}
                                </div>
                                <div className="bg-card border border-card-border p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-text-secondary leading-relaxed">
                                   {post.content}
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>

                   {/* Post Input */}
                   <div className="p-6 pt-0 shrink-0">
                      {(isTeacher || classData.settings?.allowStudentPosts) ? (
                        <form onSubmit={handlePost} className="relative">
                           <textarea 
                             rows={1}
                             value={newPost}
                             onChange={(e) => setNewPost(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handlePost(e);
                               }
                             }}
                             placeholder={`Start a new conversation, use @ to mention...`}
                             className="w-full bg-card border border-card-border rounded-2xl px-6 py-4 pr-24 text-sm font-medium focus:border-primary transition-all outline-none shadow-xl resize-none max-h-32"
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <button 
                                type="submit"
                                disabled={!newPost.trim() || posting}
                                className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                              >
                                 {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              </button>
                           </div>
                        </form>
                      ) : (
                        <div className="p-4 bg-card-hover border border-card-border rounded-2xl flex items-center justify-center gap-3 text-text-tertiary italic text-sm">
                           <Lock className="w-4 h-4" /> Student posting is disabled for this channel.
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'assignments' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar"
                >
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                         <h2 className="text-3xl font-black text-text-primary tracking-tighter">Assignments</h2>
                         <p className="text-text-tertiary font-medium">Track and submit your work for this class.</p>
                      </div>
                      {isTeacher && (
                        <Link href="/tasks" className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all">
                           <Plus className="w-4 h-4" /> Create New
                        </Link>
                      )}
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {assignments.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-20 italic border-2 border-dashed border-card-border rounded-3xl">
                           <ClipboardList className="w-12 h-12 mb-2" />
                           <p>No assignments posted yet.</p>
                        </div>
                      ) : (
                        assignments.map((task: any) => (
                          <div key={task._id} className="bg-card border border-card-border rounded-2xl p-6 flex items-center justify-between group hover:shadow-lg transition-all">
                             <div className="flex items-center gap-5">
                                <div className={clsx(
                                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
                                  task.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-card-hover text-text-tertiary border-card-border"
                                )}>
                                   {task.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                                </div>
                                <div>
                                   <h4 className="text-base font-black text-text-primary group-hover:text-primary transition-colors">{task.title}</h4>
                                   <div className="flex items-center gap-3 mt-1">
                                      <span className="flex items-center gap-1.5 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                         <Calendar className="w-3.5 h-3.5" /> Due {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-card-border" />
                                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{task.coins || 50} Coins</span>
                                   </div>
                                </div>
                             </div>
                             <Link href={`/tasks`} className="px-5 py-2 bg-card-hover border border-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:bg-primary hover:text-white hover:border-primary transition-all">
                                View Details
                             </Link>
                          </div>
                        ))
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 p-8 space-y-10 max-w-3xl"
                >
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black text-text-primary tracking-tighter">Settings</h2>
                      <p className="text-text-tertiary font-medium">Manage class preferences and permissions.</p>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-card border border-card-border rounded-3xl overflow-hidden shadow-sm">
                         <div className="p-6 border-b border-card-border bg-card-hover/30">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">General Access</h3>
                         </div>
                         <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                  <p className="text-sm font-black text-text-primary">Invite Code</p>
                                  <p className="text-xs text-text-tertiary font-medium">Share this code with students to join.</p>
                               </div>
                               <div className="px-6 py-3 bg-card-hover border border-card-border rounded-2xl text-2xl font-black tracking-widest text-primary shadow-inner">
                                  {classData.inviteCode}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-card border border-card-border rounded-3xl overflow-hidden shadow-sm">
                         <div className="p-6 border-b border-card-border bg-card-hover/30">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Permissions</h3>
                         </div>
                         <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                  <p className="text-sm font-black text-text-primary">Student Messaging</p>
                                  <p className="text-xs text-text-tertiary font-medium">Allow students to post messages in the general channel.</p>
                               </div>
                               <button 
                                 onClick={() => isTeacher && togglePermission('allowStudentPosts', !classData.settings.allowStudentPosts)}
                                 className={clsx(
                                   "w-14 h-8 rounded-full relative transition-all duration-300",
                                   classData.settings.allowStudentPosts ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-card-hover border border-card-border",
                                   !isTeacher && "opacity-50 cursor-not-allowed"
                                 )}
                               >
                                  <div className={clsx(
                                    "absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300",
                                    classData.settings.allowStudentPosts ? "right-1" : "left-1"
                                  )} />
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
               {activeTab === 'students' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar"
                >
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black text-text-primary tracking-tighter">Student Management</h2>
                      <p className="text-text-tertiary font-medium">Manage the roster for this workspace.</p>
                   </div>

                   {isTeacher && (
                      <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm">
                         <form onSubmit={handleAddStudent} className="flex gap-4">
                            <div className="flex-1 relative">
                               <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                               <input 
                                 type="text"
                                 value={searchUsername}
                                 onChange={(e) => setSearchUsername(e.target.value)}
                                 placeholder="Enter student username..."
                                 className="w-full bg-card-hover border border-card-border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-text-primary focus:border-primary transition-all outline-none caret-primary shadow-inner"
                               />
                            </div>
                            <button 
                              type="submit"
                              disabled={isAddingStudent || !searchUsername.trim()}
                              className="bg-primary text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                               {isAddingStudent ? 'Adding...' : 'Add Student'}
                            </button>
                         </form>
                         {addError && <p className="mt-3 text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-wider animate-pulse">{addError}</p>}
                      </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classData.students?.map((student: any) => (
                        <div key={student._id} className="bg-card border border-card-border rounded-2xl p-6 flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center font-black text-primary border border-primary/10">
                                 {student.username?.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-text-primary">{student.username}</h4>
                                 <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Level {student.level || 1} Student</p>
                              </div>
                           </div>
                           {isTeacher && (
                             <button 
                               onClick={() => handleRemoveStudent(student._id)}
                               className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      ))}
                      {(!classData.students || classData.students.length === 0) && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20 italic">
                           <Users className="w-12 h-12 mb-2" />
                           <p>No students have joined yet.</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
        active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-text-tertiary hover:bg-card-hover hover:text-text-primary"
      )}
    >
       <Icon className={clsx("w-6 h-6 shrink-0 transition-transform group-active:scale-90", active && "animate-pulse")} />
       <span className="hidden md:block text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
