"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, User, Bot, Trash2, Plus, Image as ImageIcon, X, ChevronRight, History } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { Brain, Lightbulb, Calculator, Leaf } from "lucide-react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  createdAt?: string;
}

interface ChatSession {
  _id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export default function AskCribbyPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || (session?.user as any)?.username || "Student";
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      if (Array.isArray(data)) {
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const loadChat = async (id: string) => {
    setCurrentChatId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/history?chatId=${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([{ 
      role: "assistant", 
      content: "Hi there! I'm Cribby, your personal study assistant. How can I help you manage your tasks today?" 
    }]);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;
    
    const userMessage: Message = { role: "user", content: input, image: selectedImage || undefined };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          chatId: currentChatId,
          image: userMessage.image
        }),
      });
      const data = await res.json();
      
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        if (!currentChatId) {
          setCurrentChatId(data.chatId);
          fetchHistory();
        }
      }
    } catch (err) {
      console.error("Chat failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history?chatId=${id}`, { method: "DELETE" });
      setChats(prev => prev.filter(c => c._id !== id));
      if (currentChatId === id) startNewChat();
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  // Image Upload Logic
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 overflow-hidden animate-fade-in">
      {/* Sidebar - History */}
      <motion.div 
        animate={{ width: isSidebarOpen ? "320px" : "0px", opacity: isSidebarOpen ? 1 : 0 }}
        className="glass rounded-2xl flex flex-col overflow-hidden border-white/20 shadow-xl relative"
      >
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-xs text-text-secondary flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </h3>
          <button 
            onClick={startNewChat}
            className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={clsx(
                "w-full p-4 rounded-2xl text-left transition-all group relative cursor-pointer",
                currentChatId === chat._id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "hover:bg-card-hover text-text-primary"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-bold truncate pr-6">{chat.title}</p>
                <button 
                  onClick={(e) => deleteChat(chat._id, e)}
                  className={clsx(
                    "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg",
                    currentChatId === chat._id ? "hover:bg-white/20" : "hover:bg-red-500/10 text-red-400"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={clsx(
                "text-[10px] line-clamp-1",
                currentChatId === chat._id ? "text-white/70" : "text-text-secondary"
              )}>
                {chat.lastMessage || "No messages yet"}
              </p>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">No history yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-card-border bg-card/40 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-card-hover transition-colors border border-card-border"
            >
              <ChevronRight className={clsx("w-5 h-5 transition-transform", isSidebarOpen ? "rotate-180" : "")} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center shadow-lg border border-card-border overflow-hidden">
                <img src="/cribby-ask.png" alt="Cribby" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-primary tracking-tight">Cribby AI</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto space-y-8 animate-fade-in py-2">
              {/* Header: Slim Row */}
              <div className="flex items-center gap-6 bg-card/50 p-6 rounded-2xl border border-card-border shadow-sm">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-card rounded-xl border border-card-border shadow-soft flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  <img src="/cribby-excited.png" alt="Cribby" className="w-full h-full object-contain p-2" />
                </motion.div>
                <div className="space-y-0.5">
                  <h1 className="text-3xl font-black text-text-primary tracking-tighter">
                    Welcome back, <span className="text-primary italic">{userName}</span>
                  </h1>
                  <p className="text-sm text-text-secondary font-medium tracking-tight">
                    Pick a task to get started or ask me anything.
                  </p>
                </div>
              </div>

              {/* Actions Grid: Compact */}
              <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3">
                <WelcomeCard icon={Brain} title="Deep Summary" desc="Turn long assignments into key takeaways" onClick={() => setInput("Can you summarize my recent assignments?")} />
                <WelcomeCard icon={Calculator} title="Math Master" desc="Step-by-step logic for any problem" onClick={() => setInput("I need help with a math problem.")} />
                <WelcomeCard icon={Leaf} title="Eco Ideas" desc="Fresh concepts for sustainability" onClick={() => setInput("Suggest some eco-friendly class projects.")} />
                <WelcomeCard icon={Lightbulb} title="Focus Plan" desc="A custom study schedule for your tasks" onClick={() => setInput("Suggest a study schedule for my current tasks.")} />
              </div>
            </div>
          ) : (
            <div className="space-y-10 max-w-5xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={clsx(
                      "flex gap-6 max-w-[90%] group",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={clsx(
                      "w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transition-all group-hover:scale-110 overflow-hidden border",
                      msg.role === "assistant" 
                        ? "bg-card border-card-border" 
                        : "bg-primary border-primary/20 text-white"
                    )}>
                      {msg.role === "assistant" ? (
                        <img src="/cribby-ask.png" alt="Cribby" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7" />
                      )}
                    </div>
                    <div className={clsx(
                      "flex flex-col gap-3",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={clsx(
                        "p-6 rounded-2xl shadow-premium text-base font-medium leading-relaxed prose max-w-none dark:prose-invert transition-all",
                        msg.role === "assistant" 
                          ? "bg-card text-text-primary rounded-tl-none border border-card-border" 
                          : "bg-primary text-white rounded-tr-none shadow-primary/20 prose-invert"
                      )}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Uploaded context" 
                            className="mb-6 rounded-2xl max-h-80 object-cover shadow-2xl border border-white/20"
                          />
                        )}
                        <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity px-4">
                        {msg.role === "assistant" ? "Cribby Assistant" : "You"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {loading && (
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-6 animate-pulse opacity-50">
                <div className="w-14 h-14 rounded-2xl bg-card-hover border border-card-border" />
                <div className="space-y-3 flex-1 pt-2">
                  <div className="h-4 bg-card-hover rounded-full w-2/3" />
                  <div className="h-4 bg-card-hover rounded-full w-1/2" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-card/40 border-t border-card-border backdrop-blur-2xl">
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 relative w-32 h-32"
            >
              <img src={selectedImage} className="w-full h-full object-cover rounded-2xl shadow-xl border-4 border-card-bg" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative flex items-center">
              <div {...getRootProps()} className={clsx(
                "absolute left-4 p-3 rounded-xl transition-all cursor-pointer z-10",
                isDragActive ? "bg-primary text-white scale-110" : "text-text-secondary hover:bg-card-hover"
              )}>
                <input {...getInputProps()} />
                <ImageIcon className="w-6 h-6" />
              </div>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Cribby about tasks, finance, or anything..."
                className="w-full glass pl-16 pr-6 py-5 rounded-2xl border-card-border focus:border-primary outline-none transition-all font-semibold text-text-primary placeholder:text-text-secondary resize-none max-h-32 min-h-[70px] shadow-inner shadow-black/5"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={loading || (!input.trim() && !selectedImage)}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex-shrink-0"
            >
              <Send className="w-7 h-7" />
            </button>
          </div>
          <div className="mt-6 flex justify-center gap-8 opacity-40">
            {["Study Schedule", "Task Priority", "Financial Tips", "Image Analysis"].map((tag) => (
              <span key={tag} className="text-[10px] font-black uppercase tracking-[0.3em] text-text-primary">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeCard({ icon: Icon, title, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="bg-card border border-card-border p-6 rounded-2xl text-left hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
    >
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-black text-text-primary mb-1">{title}</h4>
      <p className="text-[10px] text-text-secondary font-medium leading-relaxed">{desc}</p>
    </button>
  );
}
