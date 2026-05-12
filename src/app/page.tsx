import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Rocket, BookOpen, Leaf, Coins, Zap, Globe, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 lg:px-24 fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100">C</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">ClassCrib</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Log In</Link>
          <Link href="/signup" className="btn btn-primary px-5 py-2.5 rounded-lg text-sm shadow-indigo-100">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 md:px-12 lg:px-24 text-center space-y-10 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-slide-up">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">Enterprise-Grade Student Hub</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight animate-slide-up [animation-delay:100ms]">
          The new standard for <br />
          <span className="text-indigo-600">Educational Productivity.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium animate-slide-up [animation-delay:200ms] leading-relaxed">
          ClassCrib combines advanced task management with real-world financial literacy, 
          empowering students to learn, earn, and excel in a professional ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up [animation-delay:300ms]">
          <Link href="/signup" className="btn btn-primary h-14 px-8 text-base group w-full sm:w-auto shadow-xl shadow-indigo-200/50">
            Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="btn btn-secondary h-14 px-8 text-base w-full sm:w-auto">Request a Demo</Link>
        </div>

        {/* Dashboard Mockup */}
        <div className="pt-20 animate-fade-in [animation-delay:500ms] max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white rounded-[2.5rem] border border-slate-200 p-4 shadow-2xl">
              <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8 md:p-12 aspect-[16/9] flex flex-col gap-8">
                 <div className="flex justify-between items-center">
                    <div className="space-y-2 text-left">
                       <div className="h-4 w-40 bg-slate-200 rounded-full" />
                       <div className="h-2 w-24 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100" />
                       <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100" />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-6 flex-1">
                    <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
                       <div className="h-3 w-32 bg-slate-100 rounded-full" />
                       <div className="space-y-3 pt-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100/50" />
                          ))}
                       </div>
                    </div>
                    <div className="bg-indigo-600 rounded-2xl p-6 flex flex-col justify-between">
                       <div className="h-3 w-20 bg-white/20 rounded-full" />
                       <div className="h-10 w-10 bg-white/20 rounded-lg" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 opacity-50 grayscale">
          <div className="flex items-center gap-2 font-black text-xl"><Globe className="w-6 h-6" /> GLOBALLEARN</div>
          <div className="flex items-center gap-2 font-black text-xl"><Shield className="w-6 h-6" /> SECUREED</div>
          <div className="flex items-center gap-2 font-black text-xl"><Users className="w-6 h-6" /> EDUCOMM</div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            icon={Rocket} 
            title="Accelerated Learning" 
            desc="Our proprietary productivity engine uses behavioral science to keep students engaged and ahead of the curve." 
          />
          <FeatureCard 
            icon={Shield} 
            title="Financial Intelligence" 
            desc="Students manage complex virtual economies, learning critical concepts like asset allocation and liquidity." 
          />
          <FeatureCard 
            icon={BookOpen} 
            title="Professional Network" 
            desc="A secure, high-fidelity environment for students to collaborate, compete, and build their future profile." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 lg:px-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5 opacity-50">
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-base font-bold text-slate-900 tracking-tight">ClassCrib</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 CLASSCRIB CORP</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/20 transition-all duration-500 flex flex-col gap-6 group">
      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );
}

