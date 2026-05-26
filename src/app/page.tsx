"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Rocket, 
  BookOpen, 
  Leaf, 
  Coins, 
  Zap, 
  Globe, 
  Users, 
  Sun, 
  Moon, 
  Stars, 
  Check, 
  Plus, 
  Minus,
  Calendar,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Droplets,
  Trees,
  ShoppingBag,
  GraduationCap,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  MessageSquare
} from "lucide-react";

// Interactive Simulator Types & Data
interface UpgradeItem {
  id: string;
  title: string;
  cost: number;
  icon: any;
  color: string;
  desc: string;
  benefit: string;
}

const UPGRADES: UpgradeItem[] = [
  { id: "garden", title: "Backyard Garden", cost: 500, icon: Trees, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", desc: "Grow virtual plants & trees.", benefit: "Adds lush 3D greenery to your property" },
  { id: "solar", title: "Solar Panel Array", cost: 1200, icon: Sun, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", desc: "Harness daylight energy.", benefit: "Electricity bill drops by 30% permanently" },
  { id: "battery", title: "Tesla Powerwall", cost: 2500, icon: Zap, color: "text-rose-500 bg-rose-500/10 border-rose-500/20", desc: "Advanced energy cell.", benefit: "Electricity bill drops by 80% permanently" },
  { id: "reservoir", title: "Water Reservoir", cost: 1800, icon: Droplets, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", desc: "Harvest local rainwater.", benefit: "Water bill drops by 50% permanently" },
  { id: "advisor", title: "Tax Consultant", cost: 3500, icon: Shield, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", desc: "Optimize tax filings.", benefit: "Property Tax drops by 20% permanently" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  // Interactive Simulator State
  const [coins, setCoins] = useState(4000);
  const [simulatorLevel, setSimulatorLevel] = useState(1);
  const [activeUpgrades, setActiveUpgrades] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Bento Feature Grid active tab
  const [activeTab, setActiveTab] = useState<"crib" | "bills" | "streaks" | "neighborhood" | "cribby">("crib");

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Theme Sync on Mount
  useEffect(() => {
    setMounted(true);
    const localTheme = localStorage.getItem("classcrib-theme") || "light";
    setTheme(localTheme);
    document.documentElement.setAttribute("data-theme", localTheme);
  }, []);

  const changeTheme = (themeId: string) => {
    setTheme(themeId);
    localStorage.setItem("classcrib-theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  };

  // Live Simulator Calculations
  const baseElectricity = 200;
  const baseWater = 150;
  const baseTax = 300;

  const electricDiscount = activeUpgrades.includes("battery") ? 0.2 : activeUpgrades.includes("solar") ? 0.7 : 1.0;
  const waterDiscount = activeUpgrades.includes("reservoir") ? 0.5 : 1.0;
  const taxDiscount = activeUpgrades.includes("advisor") ? 0.8 : 1.0;

  const finalElectricity = Math.floor(baseElectricity * electricDiscount);
  const finalWater = Math.floor(baseWater * waterDiscount);
  const finalTax = Math.floor(baseTax * taxDiscount);
  const weeklyBills = finalElectricity + finalWater + finalTax;

  // Let's assume student earns 600 coins a week from homework
  const weeklyIncome = 600;
  const netWeeklySavings = weeklyIncome - weeklyBills;

  const handleBuyUpgrade = (upgrade: UpgradeItem) => {
    if (activeUpgrades.includes(upgrade.id)) {
      // Sell back at full price for interactive ease
      setActiveUpgrades(prev => prev.filter(id => id !== upgrade.id));
      setCoins(prev => prev + upgrade.cost);
      triggerNotification(`Refunded ${upgrade.title}! +${upgrade.cost} Coins.`);
    } else {
      if (coins >= upgrade.cost) {
        setCoins(prev => prev - upgrade.cost);
        setActiveUpgrades(prev => [...prev, upgrade.id]);
        triggerNotification(`Purchased ${upgrade.title}! Weekly bills decreased!`);
      } else {
        triggerNotification("Oops! Complete more homework tasks to earn coins.");
      }
    }
  };

  const handleSimLevelUp = () => {
    const cost = simulatorLevel * 600;
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setSimulatorLevel(prev => prev + 1);
      triggerNotification(`Hooray! upgraded your Crib to Level ${simulatorLevel + 1}!`);
    } else {
      triggerNotification(`Need ${cost} Coins to upgrade level.`);
    }
  };

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 4000);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
  }

  const faqData = [
    {
      q: "What is ClassCrib?",
      a: "ClassCrib is a revolutionary gamified student productivity platform. It merges school assignment tracking with real-world financial literacy. Students complete academic tasks set by their teachers to earn 'Crib Coins,' which they use to manage virtual utilities, buy sustainable energy upgrades, and personalize their interactive 3D home."
    },
    {
      q: "How does the financial literacy aspect work?",
      a: "Instead of just getting an abstract grade, students receive virtual salary payouts in ClassCrib Coins. However, their virtual home accrues real-time utility bills (Electricity, Water) and Property Taxes. To optimize their budget, students must buy green-tech assets (like Solar panels or Water Reservoirs) that have high upfront costs but reduce bills permanently—simulating real-world capital investments and cash flow management."
    },
    {
      q: "What happens if a student forgets to pay their bills?",
      a: "Just like in real life, financial choices have consequences! If a student ignores their bills, they face a utility cutoff (e.g. the 3D room's lights turn off) or even a virtual 'Tax Raid' where they lose a portion of their assets. This provides a safe, low-stakes environment to understand the importance of credit, billing cycles, and prompt financial accountability."
    },
    {
      q: "Is it suitable for high schools and middle schools?",
      a: "Absolutely! ClassCrib is built with high-fidelity, premium visuals that engage high-school students, while the behavioral gamification keeps middle-schoolers actively excited. Teachers can create virtual classrooms, assign tasks, and monitor streak completions through an elegant teacher dashboard."
    },
    {
      q: "Is ClassCrib COPPA compliant and secure?",
      a: "Yes, security and privacy are engineered into the platform. We support parent emails for automated progress reporting, private profiles that hide metrics from global leaderboards, and use secure enterprise-grade systems so student data is always fully protected."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-500 overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      
      {/* Decorative Floating Blur Orbs */}
      <div className="absolute top-[10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-primary/10 to-violet-500/10 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-bl from-amber-500/5 to-primary/10 blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-t from-emerald-500/5 to-indigo-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />

      {/* Sticky Premium Header */}
      <nav className="sticky top-0 w-full z-50 glass border-b border-card-border backdrop-blur-xl h-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative overflow-hidden rounded-xl shadow-lg shadow-indigo-500/10 hover:rotate-6 transition-transform flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-extrabold text-text-primary tracking-tighter leading-none">
                Class<span className="text-primary text-gradient">Crib</span>
              </span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Earn. Learn. Grow.</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-black uppercase tracking-widest text-[10px] text-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#simulator" className="hover:text-primary transition-colors">Crib Economy</a>
            <a href="#pedagogy" className="hover:text-primary transition-colors">For Educators</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>

          {/* Actions & Theme Toggler */}
          <div className="flex items-center gap-4">
            
            {/* 3-State Theme Capsule Slider */}
            <div className="bg-card-hover border border-card-border p-1 rounded-2xl flex items-center gap-1 shadow-inner relative">
              <button 
                onClick={() => changeTheme("light")}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 ${theme === "light" ? "text-primary bg-card shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => changeTheme("dark")}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 ${theme === "dark" ? "text-primary bg-card shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => changeTheme("midnight")}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 ${theme === "midnight" ? "text-primary bg-card shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
                title="Midnight Theme"
              >
                <Stars className="w-4 h-4" />
              </button>
            </div>

            {/* Auth Actions */}
            <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="btn btn-primary px-5 py-3 rounded-xl shadow-lg shadow-primary/20 text-[10px] uppercase font-black tracking-widest">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-8 text-left">
          
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full shadow-sm animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              Gamified Student Productivity & Finance Hub
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-primary leading-[1.05] tracking-tighter animate-slide-up [animation-delay:100ms]">
            Where School <br />
            <span className="text-primary text-gradient">Homework Meets Wealth.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary font-medium leading-relaxed max-w-xl animate-slide-up [animation-delay:200ms]">
            ClassCrib translates academic assignments into a live virtual economy. Track tasks, earn virtual coins, invest in solar technology, and design your dream interactive 3D crib.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-slide-up [animation-delay:300ms]">
            <Link href="/signup" className="btn btn-primary h-14 px-8 text-base shadow-xl shadow-primary/20 group hover:scale-[1.02]">
              Start Your Journey <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#simulator" className="btn btn-secondary h-14 px-8 text-base border-card-border hover:bg-card hover:scale-[1.02]">
              Try the Live Simulator
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-card-border/60 max-w-lg animate-slide-up [animation-delay:400ms]">
            <div>
              <p className="text-3xl font-black text-text-primary tracking-tight">100%</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">Gamified Tasks</p>
            </div>
            <div>
              <p className="text-3xl font-black text-text-primary tracking-tight">80%</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">Bill Reductions</p>
            </div>
            <div>
              <p className="text-3xl font-black text-text-primary tracking-tight">3D</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">Virtual Real Estate</p>
            </div>
          </div>
        </div>

        {/* Hero Right Visual: Dashboard Preview Card */}
        <div className="lg:col-span-6 animate-scale-in relative">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-violet-500 rounded-[2.5rem] blur opacity-15 hover:opacity-25 transition duration-1000" />
          
          <div className="relative bg-card border border-card-border rounded-[2.5rem] p-6 shadow-2xl overflow-hidden backdrop-blur-md">
            
            {/* Visual Header */}
            <div className="flex justify-between items-center mb-6 border-b border-card-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
              </div>
              <div className="px-4 py-1.5 bg-card-hover border border-card-border rounded-xl text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Student Portal Mockup
              </div>
            </div>

            {/* Dashboard Visual Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Stats & Virtual Crib */}
              <div className="md:col-span-7 space-y-6">
                
                {/* 3D Crib Scene Simulation Container */}
                <div className="relative bg-card-hover border border-card-border rounded-2xl h-48 overflow-hidden flex flex-col justify-between p-4 group">
                  
                  {/* Floating particles background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-[9px] font-black text-primary rounded-lg uppercase tracking-widest">
                      🏡 Level 4 Crib
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] font-bold">
                      <Coins className="w-3.5 h-3.5" /> 8,450 Coins
                    </div>
                  </div>

                  {/* Isometric House Render CSS representation */}
                  <div className="flex items-center justify-center py-4 relative">
                    <div className="w-24 h-24 relative flex items-center justify-center">
                      {/* House Base block */}
                      <div className="absolute w-20 h-14 bg-gradient-to-tr from-primary to-indigo-600 rounded-lg shadow-lg rotate-12 transform skew-x-12 flex items-center justify-center text-white text-3xl font-bold border border-primary-light">
                        🏡
                      </div>
                      {/* Solar arrays visual if purchased */}
                      <div className="absolute -top-3 w-16 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded border border-amber-300 shadow-md rotate-12 transform skew-x-12 z-20 flex items-center justify-center text-[7px] text-white font-extrabold uppercase tracking-wide">
                        SOLAR ACTIVE
                      </div>
                      {/* Ambient Glowing border */}
                      <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl -z-10 group-hover:scale-125 transition-transform duration-700" />
                    </div>
                  </div>

                  <div className="w-full space-y-2 z-10">
                    <div className="flex justify-between text-[9px] font-black text-text-tertiary uppercase tracking-widest">
                      <span>Crib Upgrades</span>
                      <span>3 / 8 Owned</span>
                    </div>
                    <div className="h-2 w-full bg-card rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "37%" }} />
                    </div>
                  </div>
                </div>

                {/* Real-time financial balances */}
                <div className="bg-card-hover border border-card-border p-4 rounded-2xl grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Weekly Bills</p>
                    <p className="text-xl font-black text-rose-500">-240 Coins</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Homework Income</p>
                    <p className="text-xl font-black text-emerald-500">+600 Coins</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Weekly Utility Bills & Action Buttons */}
              <div className="md:col-span-5 space-y-4">
                
                {/* Utilities Card List */}
                <div className="bg-card-hover border border-card-border rounded-2xl p-4 space-y-3.5">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-card-border/60 pb-2">
                    Utility Status
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-text-secondary">Electric</span>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Paid</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Droplets className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-text-secondary">Water</span>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Paid</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-text-secondary">Property Tax</span>
                    </div>
                    <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Overdue</span>
                  </div>
                </div>

                {/* Assignment Streaks Mockup */}
                <div className="bg-card-hover border border-card-border rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Study Streak</span>
                    <span className="text-[10px] font-black text-primary">🔥 5 Days</span>
                  </div>
                  <div className="flex gap-1.5 justify-between">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[8px] font-black">
                        ✓
                      </div>
                    ))}
                    {[6, 7].map(i => (
                      <div key={i} className="w-5 h-5 rounded-md bg-card border border-card-border" />
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* Trust & Brand Banner */}
      <section className="py-12 border-y border-card-border bg-card-hover/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-60 grayscale hover:opacity-90 hover:grayscale-0 transition-all duration-300">
          <div className="flex items-center gap-2.5 font-black text-lg text-text-secondary"><Globe className="w-5 h-5" /> GLOBALLEARN CO</div>
          <div className="flex items-center gap-2.5 font-black text-lg text-text-secondary"><Shield className="w-5 h-5" /> SECUREED TECH</div>
          <div className="flex items-center gap-2.5 font-black text-lg text-text-secondary"><Users className="w-5 h-5" /> EDUCOMM NETWORK</div>
          <div className="flex items-center gap-2.5 font-black text-lg text-text-secondary"><GraduationCap className="w-6 h-6" /> K12 ACADEMICS</div>
        </div>
      </section>

      {/* Simulator Headline */}
      <div id="simulator" className="pt-28 pb-6 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest">
          <Coins className="w-3.5 h-3.5" /> Interactive Economy Sandbox
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
          Test the ClassCrib <span className="text-primary text-gradient">Utility Simulator</span>
        </h2>
        <p className="text-base md:text-lg text-text-secondary font-medium">
          Buy sustainable upgrades below using your starting sandbox coins. Watch your weekly expenses shrink and your net weekly balance soar! Complete the visual crib.
        </p>
      </div>

      {/* Live Interactive Simulator Section */}
      <section className="pb-28 px-6 md:px-12 max-w-7xl mx-auto">
        
        {/* Simulator Grid wrapper */}
        <div className="bento-card p-8 bg-card border-card-border shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
          
          {/* Toast Notification for action feedback */}
          {showNotification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary border border-primary-light text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl shadow-2xl z-50 animate-fade-in flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{showNotification}</span>
            </div>
          )}

          {/* SIMULATOR LEFT: Upgrades Shop (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-text-primary tracking-tight">Sandbox Upgrades Shop</h3>
              <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Select items to buy or sell to optimize your budget</p>
            </div>

            {/* List of upgrades */}
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 no-scrollbar">
              {UPGRADES.map(upgrade => {
                const isOwned = activeUpgrades.includes(upgrade.id);
                const canAfford = coins >= upgrade.cost;
                const IconComponent = upgrade.icon;

                return (
                  <div 
                    key={upgrade.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                      isOwned 
                        ? "bg-primary/5 border-primary/30 shadow-md shadow-primary/5" 
                        : "bg-card-hover border-card-border hover:bg-card hover:border-text-tertiary"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all flex-shrink-0 ${upgrade.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      
                      {/* Title & Desc */}
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-text-primary tracking-tight">{upgrade.title}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-card border border-card-border text-text-secondary rounded">
                            Cost: {upgrade.cost} Coins
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary font-medium leading-normal">{upgrade.desc}</p>
                        <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> {upgrade.benefit}
                        </p>
                      </div>
                    </div>

                    {/* Purchase Action Button */}
                    <button
                      onClick={() => handleBuyUpgrade(upgrade)}
                      className={`w-full sm:w-auto h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                        isOwned 
                          ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/10" 
                          : canAfford 
                            ? "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20" 
                            : "bg-card-border text-text-tertiary cursor-not-allowed"
                      }`}
                    >
                      {isOwned ? (
                        <>Sell back <Minus className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Buy upgrade <Plus className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Simulated Balance Sheet */}
            <div className="bg-card-hover border border-card-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
              <div>
                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Remaining Coins</p>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-black text-text-primary">{coins.toLocaleString()} Coins</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCoins(prev => prev + 1000);
                    triggerNotification("Earned sandbox allowance! +1000 Coins.");
                  }}
                  className="btn btn-secondary h-12 px-4 text-xs font-black uppercase tracking-widest border-card-border hover:bg-card text-emerald-500"
                >
                  Simulate homework (+1000 Coins)
                </button>
              </div>
            </div>

          </div>

          {/* SIMULATOR RIGHT: Simulated Crib View Dashboard (5 Columns) */}
          <div className="lg:col-span-5 bg-card-hover border border-card-border rounded-3xl p-6 flex flex-col justify-between space-y-6">
            
            {/* Visualizer header */}
            <div className="flex justify-between items-center border-b border-card-border/60 pb-3">
              <span className="text-sm font-black text-text-primary tracking-tight">Crib Visual Dashboard</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                Active Sandbox
              </span>
            </div>

            {/* Virtual Crib graphic that unlocks assets */}
            <div className="relative border border-card-border bg-card rounded-2xl h-56 flex flex-col items-center justify-center p-4 overflow-hidden group shadow-inner">
              
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:1rem_1rem]" />

              {/* Dynamic isometric visual */}
              <div className="w-32 h-32 relative flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                
                {/* 3D House Box */}
                <div className="absolute w-24 h-18 bg-gradient-to-tr from-primary to-indigo-700 rounded-xl shadow-2xl border border-primary-light flex items-center justify-center text-white text-3xl font-black">
                  🏡
                </div>

                {/* Backyard Garden visual */}
                {activeUpgrades.includes("garden") && (
                  <div className="absolute bottom-1 right-[-24px] text-2xl animate-fade-in" title="Backyard Garden">
                    🌳🌷
                  </div>
                )}

                {/* Solar Panel array visual */}
                {activeUpgrades.includes("solar") && (
                  <div className="absolute top-2 w-20 h-6 bg-gradient-to-r from-orange-400 to-amber-500 border border-orange-300 rounded shadow-md -rotate-6 z-20 flex items-center justify-center text-[7px] text-white font-extrabold uppercase tracking-widest animate-fade-in">
                    Solar Panel
                  </div>
                )}

                {/* Tesla battery storage visual */}
                {activeUpgrades.includes("battery") && (
                  <div className="absolute bottom-[-16px] left-[-20px] bg-rose-500 text-white font-black text-[7px] px-2 py-1 rounded border border-rose-300 shadow-md animate-fade-in">
                    ⚡ POWERWALL
                  </div>
                )}

                {/* Water Reservoir visual */}
                {activeUpgrades.includes("reservoir") && (
                  <div className="absolute top-8 left-[-32px] text-2xl animate-fade-in" title="Water Reservoir">
                    🪣💧
                  </div>
                )}

                {/* Tax consultant sign */}
                {activeUpgrades.includes("advisor") && (
                  <div className="absolute bottom-10 right-[-32px] text-lg bg-indigo-600 text-white font-bold p-1 rounded-full border border-indigo-400 animate-fade-in" title="Tax Consultant Active">
                    💼
                  </div>
                )}

              </div>

              {/* Dynamic status string */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[9px] font-black text-text-tertiary uppercase tracking-widest z-10">
                <span>Crib Level: {simulatorLevel}</span>
                <span>Active Assets: {activeUpgrades.length} / 5</span>
              </div>
            </div>

            {/* Math Calculator panel */}
            <div className="space-y-3.5">
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest border-b border-card-border/60 pb-2">
                Simulated Operating Bills
              </p>

              {/* Electricity Row */}
              <div className="flex justify-between items-center text-sm font-bold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Electricity Bill
                </span>
                <div className="flex items-center gap-2">
                  {activeUpgrades.includes("solar") || activeUpgrades.includes("battery") ? (
                    <span className="text-xs text-text-tertiary line-through">{baseElectricity}</span>
                  ) : null}
                  <span className={activeUpgrades.includes("battery") ? "text-rose-500 font-extrabold" : "text-text-primary"}>
                    {finalElectricity} Coins
                  </span>
                </div>
              </div>

              {/* Water Row */}
              <div className="flex justify-between items-center text-sm font-bold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Water Bill
                </span>
                <div className="flex items-center gap-2">
                  {activeUpgrades.includes("reservoir") ? (
                    <span className="text-xs text-text-tertiary line-through">{baseWater}</span>
                  ) : null}
                  <span className={activeUpgrades.includes("reservoir") ? "text-blue-500 font-extrabold" : "text-text-primary"}>
                    {finalWater} Coins
                  </span>
                </div>
              </div>

              {/* Property Tax Row */}
              <div className="flex justify-between items-center text-sm font-bold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" /> Property Tax
                </span>
                <div className="flex items-center gap-2">
                  {activeUpgrades.includes("advisor") ? (
                    <span className="text-xs text-text-tertiary line-through">{baseTax}</span>
                  ) : null}
                  <span className={activeUpgrades.includes("advisor") ? "text-indigo-500 font-extrabold" : "text-text-primary"}>
                    {finalTax} Coins
                  </span>
                </div>
              </div>

              {/* Net Balance calculations */}
              <div className="h-px bg-card-border/60 my-2" />
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-sm font-black text-text-primary">
                  <span>Weekly Expenditures:</span>
                  <span className="text-rose-500">-{weeklyBills} Coins</span>
                </div>
                <div className="flex justify-between text-sm font-black text-text-primary">
                  <span>Weekly Homework Income:</span>
                  <span className="text-emerald-500">+{weeklyIncome} Coins</span>
                </div>
                <div className="flex justify-between text-base font-black text-text-primary border-t border-dashed border-card-border/60 pt-2">
                  <span>Net Savings / Surplus:</span>
                  <span className={netWeeklySavings >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {netWeeklySavings >= 0 ? "+" : ""}{netWeeklySavings} Coins/wk
                  </span>
                </div>
              </div>
            </div>

            {/* Crib level upgrade action */}
            <div className="border-t border-card-border/60 pt-4 flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Crib Upgrades</p>
                <p className="text-xs font-bold text-text-secondary">Upgrade: {simulatorLevel * 600} Coins</p>
              </div>
              
              <button
                onClick={handleSimLevelUp}
                disabled={coins < simulatorLevel * 600}
                className={`h-11 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 border ${
                  coins >= simulatorLevel * 600 
                    ? "bg-primary text-white border-primary-light hover:scale-105 shadow-md shadow-primary/10" 
                    : "bg-card-border text-text-tertiary border-card-border cursor-not-allowed"
                }`}
              >
                Level Up Crib <Trophy className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </section>

      {/* Platform Features Bento Grid Section */}
      <section id="features" className="py-24 border-y border-card-border bg-card-hover/20 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" /> High-Fidelity Specs
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
              An Elevated Suite of <span className="text-primary text-gradient">Interactive Features</span>
            </h2>
            <p className="text-base md:text-lg text-text-secondary font-medium leading-relaxed">
              Explore how ClassCrib's mechanics engage students deeply and bridge the gap between academic tasks and microeconomics.
            </p>
          </div>

          {/* Interactive Bento Tab Selectors */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { id: "crib", label: "3D Crib & Upgrades", icon: Trees },
              { id: "bills", label: "Utility & Tax Simulation", icon: Zap },
              { id: "streaks", label: "Tasks & Study Streaks", icon: Calendar },
              { id: "neighborhood", label: "Classroom Neighborhood", icon: Users },
              { id: "cribby", label: "AI Cribby Advisor", icon: MessageSquare },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border transition-all ${
                    activeTab === tab.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-card border-card-border text-text-secondary hover:border-text-tertiary hover:bg-card-hover"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Bento Showcase Card */}
          <div className="bento-card bg-card border-card-border p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all duration-300">
            
            {/* Background floating gradient decorative */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Crib Tab Info */}
            {activeTab === "crib" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-sm">
                    <Trees className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight">Interactive 3D Crib Upgrades & Shop</h3>
                  <p className="text-base text-text-secondary font-medium leading-relaxed">
                    Every student gets a custom virtual home. As they earn coins from academic homework and quizzes, they unlock upgrades in the Shop. Buy Solar Panels, Tesla Powerwalls, Water reservoirs, Sports courts, Gaming desks, or customized art studios.
                  </p>
                  <ul className="space-y-3 font-bold text-sm text-text-secondary">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Visual 3D representations render items instantly inside the virtual yard.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Upgrades have real utility value—reducing billing costs permanently.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>50+ Levels of home upgrades, matching absolute academic levels.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-card-hover border border-card-border p-6 rounded-[2rem] space-y-4">
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest text-left">Level Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-black text-xs text-text-primary">
                      <span>Crib Upgrades Owned</span>
                      <span>60%</span>
                    </div>
                    <div className="h-3 w-full bg-card rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div className="h-px bg-card-border/60" />
                  <p className="text-xs font-bold text-text-secondary text-left italic">
                    "My student completes his algebra work first thing Monday morning just to buy the Gaming Rig desk upgrade for his crib."
                  </p>
                  <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest text-left">— Sarah M., Parent</p>
                </div>
              </div>
            )}

            {/* Utility Tab Info */}
            {activeTab === "bills" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-sm">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight">Simulated Utility Bills & Tax Raids</h3>
                  <p className="text-base text-text-secondary font-medium leading-relaxed">
                    Earning virtual money is only half the battle. In ClassCrib, students must pay weekly bills for electricity, water, and property taxes using their classroom coins. If unpaid, students experience cutoffs, or virtual Tax Raids where automated audits penalize their cash balances.
                  </p>
                  <ul className="space-y-3 font-bold text-sm text-text-secondary">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Simulates cashflow, due dates, billing notifications, and critical deadlines.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Utility bills are permanently influenced by purchasing green energy upgrades.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>A low-stakes environment to face absolute financial consequences.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-card-hover border border-card-border p-6 rounded-[2rem] text-left space-y-4">
                  <div className="flex items-center gap-3 text-rose-500 font-extrabold text-sm bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Warning: Tax Raid imminent in 2 days!</span>
                  </div>
                  <div className="p-4 bg-card rounded-2xl border border-card-border space-y-2">
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span>Unpaid Water Bill</span>
                      <span className="text-rose-500 font-black">Overdue</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span>Unpaid Taxes</span>
                      <span className="text-rose-500 font-black">Overdue</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaks Tab Info */}
            {activeTab === "streaks" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shadow-sm">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight">Assignment Tracking & Study Streaks</h3>
                  <p className="text-base text-text-secondary font-medium leading-relaxed">
                    ClassCrib makes task completion highly addictive. When students check off their school assignments, their study calendar logs a 'green' active study day. Maintain a consistent streak to earn active XP multipliers, compound bonuses, and double coin payouts!
                  </p>
                  <ul className="space-y-3 font-bold text-sm text-text-secondary">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Visual calendars represent study consistency in real-time.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Weekly homework schedules directly coordinate with platform payouts.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Earn special streak medallions, certificates, and leaderboard trophies.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-card-hover border border-card-border p-6 rounded-[2rem] text-left space-y-4">
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Active Study Streaks</p>
                  <div className="text-3xl font-black text-text-primary">🔥 14 Days Straight!</div>
                  <p className="text-xs text-text-secondary font-bold">XP Multiplier is boosted to <span className="text-primary text-gradient">2.5x</span></p>
                  <div className="flex gap-2 justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black shadow-sm">
                        ✓
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Neighborhood Tab Info */}
            {activeTab === "neighborhood" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight">Classroom Neighborhood & Friend Hub</h3>
                  <p className="text-base text-text-secondary font-medium leading-relaxed">
                    Learning is social. In the multiplayer Classroom Neighborhood view, students can browse and view 3D properties built by their friends. Compete in net worth leaderboards, track XP stats, send virtual home gifts, and coordinate team challenges.
                  </p>
                  <ul className="space-y-3 font-bold text-sm text-text-secondary">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Fully customizable privacy settings ensure absolute safety control.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Send gifts, co-op coins, or host friendly virtual visits.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center text-[10px]">✓</div>
                      <span>Dynamic classroom leaderboards for net-worth, xp, and housing items.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-card-hover border border-card-border p-6 rounded-[2rem] text-left space-y-4">
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Classroom Ranking</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-card rounded-xl border border-primary/20">
                      <span className="text-xs font-bold text-text-primary">1. Alex (Crib Lvl 12)</span>
                      <span className="text-xs font-black text-primary">14,250 Coins</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-card rounded-xl border border-card-border">
                      <span className="text-xs font-bold text-text-secondary">2. Jessica (Crib Lvl 10)</span>
                      <span className="text-xs font-black text-text-secondary">11,800 Coins</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-card rounded-xl border border-card-border">
                      <span className="text-xs font-bold text-text-secondary">3. You (Crib Lvl 8)</span>
                      <span className="text-xs font-black text-text-secondary">8,450 Coins</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cribby AI Tab Info */}
            {activeTab === "cribby" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left animate-fade-in">
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight">Cribby: Your AI Homework & Wealth Companion</h3>
                  <p className="text-base text-text-secondary font-medium leading-relaxed">
                    Stuck on a tricky math equation or need tips on energy pricing? Cribby, our smart AI homework and financial guide, provides real-time tips, wealth suggestions, budget advice, and positive motivational alerts.
                  </p>
                  <ul className="space-y-3 font-bold text-sm text-text-secondary">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">✓</div>
                      <span>Get interactive alerts regarding due bills and upcoming tax schedules.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">✓</div>
                      <span>Ask homework questions and get child-safe explanatory tips.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">✓</div>
                      <span>Intelligent advice regarding high APY purchases and coin conservation.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-5 bg-card-hover border border-card-border p-6 rounded-[2rem] text-left space-y-4">
                  <div className="flex items-center gap-3 border-b border-card-border/60 pb-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">🤖</div>
                    <div>
                      <p className="text-xs font-black text-text-primary">Cribby Advisor</p>
                      <p className="text-[9px] text-text-tertiary font-bold">Online</p>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-card-border text-xs text-text-secondary leading-relaxed font-bold">
                    "Hey Alex! I see your Electricity Bill is 200 coins. If you buy the Solar Panel upgrade for 1,200 coins, it will drop to 140 coins. That's a 30% saving that pays for itself in just 20 weeks!"
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Dual Value Section (Pedagogy) */}
      <section id="pedagogy" className="py-28 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <GraduationCap className="w-3.5 h-3.5" /> Educational Alignment
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
            Loved by Students. <span className="text-primary text-gradient">Trusted by Educators.</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary font-medium">
            ClassCrib aligns play-based incentives with absolute institutional accountability, establishing consistent study habits.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Students */}
          <div className="bento-card bg-card border-card-border p-8 md:p-10 flex flex-col justify-between text-left relative overflow-hidden group hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-sm">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-text-primary tracking-tight">Why Students Stay Hooked</h3>
              <p className="text-base text-text-secondary font-medium leading-relaxed">
                Rather than viewing homework as a tedious requirement, students experience tasks as active income streams. The excitement of leveling up their 3D cribs, buying high-tier custom assets, and maintaining streaks turns daily studying into an engaging mission.
              </p>
              
              <ul className="space-y-3 font-bold text-sm text-text-secondary pt-2">
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">✓</div>
                  <span>Customize dynamic 3D homes.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">✓</div>
                  <span>Engaging multiplayer leaderboards.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">✓</div>
                  <span>Study streaks that pay multipliers.</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-card-border/60 pt-6 mt-8 flex items-center gap-4">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Core Incentive</span>
              <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-md">
                Gamified Growth
              </span>
            </div>
          </div>

          {/* Card 2: Teachers & Parents */}
          <div className="bento-card bg-card border-card-border p-8 md:p-10 flex flex-col justify-between text-left relative overflow-hidden group hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-text-primary tracking-tight">Why Parents & Educators Approve</h3>
              <p className="text-base text-text-secondary font-medium leading-relaxed">
                ClassCrib instills the critical life skills that schools rarely cover: personal budgeting, expense prioritization, compound utilities, and the rewards of prompt billing accountability. Students learn asset allocation, credit timelines, and strategic planning.
              </p>
              
              <ul className="space-y-3 font-bold text-sm text-text-secondary pt-2">
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>Real budgeting & accounting simulation.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>Child-safe environment, parent-portal tracking.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>Automated email performance summaries.</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-card-border/60 pt-6 mt-8 flex items-center gap-4">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Core Incentive</span>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
                Financial Competence
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* Call To Action Container */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="relative rounded-[3rem] bg-gradient-to-r from-primary to-indigo-700 border border-primary-light p-8 md:p-16 text-center text-white overflow-hidden shadow-2xl group">
          
          {/* Glass floating orbs inside container */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none -translate-x-12 -translate-y-12" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
              🚀 Join ClassCrib Today
            </span>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
              Ready to Upgrade <br />Your Learning Experience?
            </h2>
            
            <p className="text-base md:text-lg text-white/80 font-bold max-w-lg mx-auto">
              Join thousands of students and teachers who are standardizing productivity and mastering financial decisions daily.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto h-14 px-8 rounded-xl bg-white text-primary font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                Create Your Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto h-14 px-8 rounded-xl bg-primary-dark/40 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:bg-primary-dark/60 transition-all flex items-center justify-center hover:scale-[1.02]">
                Log In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
          </span>
          <h2 className="text-4xl font-black text-text-primary tracking-tight">
            Still Got Questions? <span className="text-primary text-gradient">We Got Answers.</span>
          </h2>
          <p className="text-base text-text-secondary font-medium">
            Learn more about the platform's economics, educational design, and child safety compliance.
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-card border border-card-border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-black text-text-primary text-base md:text-lg tracking-tight hover:bg-card-hover transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-text-tertiary" />}
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-80 border-t border-card-border/60" : "max-h-0"
                  }`}
                >
                  <p className="px-6 py-5 text-sm md:text-base text-text-secondary leading-relaxed font-bold bg-card-hover/20 text-left">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Elevated Footer */}
      <footer className="py-16 px-6 border-t border-card-border bg-card">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left mb-12">
          
          {/* Logo & Slogan Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative overflow-hidden rounded-xl shadow-lg shadow-indigo-500/10 flex-shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xl font-extrabold text-text-primary tracking-tighter leading-none">
                  ClassCrib
                </span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Earn. Learn. Grow.</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary font-bold leading-relaxed">
              Merging school productivity with sustainable financial education for the next generation of scholars.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Platform</p>
            <ul className="space-y-2.5 text-sm font-bold text-text-secondary">
              <li><a href="#features" className="hover:text-primary transition-colors">Interactive Features</a></li>
              <li><a href="#simulator" className="hover:text-primary transition-colors">Economy Sandbox</a></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Student Portal</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Educators</p>
            <ul className="space-y-2.5 text-sm font-bold text-text-secondary">
              <li><a href="#pedagogy" className="hover:text-primary transition-colors">Classroom Syllabi</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">Teacher Portal</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Case Studies</a></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Contact & Compliance</p>
            <ul className="space-y-2.5 text-sm font-bold text-text-secondary">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy & COPPA</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="mailto:support@classcrib.com" className="hover:text-primary transition-colors">support@classcrib.com</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright divider */}
        <div className="max-w-7xl mx-auto border-t border-card-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">© 2026 CLASSCRIB CORPORATION. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6 font-bold text-xs text-text-tertiary">
            <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-primary transition-colors">Security</a>
          </div>
        </div>

      </footer>

    </div>
  );
}
