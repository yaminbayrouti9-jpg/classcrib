"use client";

import { 
  TrendingUp, 
  Wallet, 
  Zap, 
  Droplets, 
  Coins,
  Activity,
  Briefcase,
  Building2,
  Loader2,
  CheckCircle,
  Flag,
  ArrowUpRight,
  ShoppingCart,
  GraduationCap,
  Leaf,
  BarChart3,
  Info,
  ChevronRight,
  ShieldCheck,
  Star,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Scale,
  Landmark,
  Globe,
  MessageSquare,
  X,
  Check,
  Send,
  Sparkles,
  HelpCircle,
  Trophy
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [userStats, setUserStats] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'store' | 'stocks'>('portfolio');
  const [selectedAsset, setSelectedAsset] = useState<'gold' | 'silver' | 'cnc500' | 'business' | 'property'>('gold');
  const [tradeAmount, setTradeAmount] = useState(1);
  
  // Cribby Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [cribbyMessages, setCribbyMessages] = useState<any[]>([
    { role: 'assistant', content: "Hi! I'm Cribby, your marketplace guide. Need help understanding the terminal, your portfolio, or the store? Just click 'Explain Me' or ask away!" }
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  // Donation State
  const [isDonating, setIsDonating] = useState(false);
  const [donateUsername, setDonateUsername] = useState("");
  const [donateAmount, setDonateAmount] = useState(10);
  const [donationStatus, setDonationStatus] = useState<string | null>(null);

  const fetchStats = async () => {
    const res = await fetch("/api/user/stats");
    const data = await res.json();
    if (data.success) setUserStats(data.stats);
  };

  const fetchMarket = async () => {
    const res = await fetch("/api/market/prices");
    const data = await res.json();
    if (data.success) setMarketData(data);
  };

  useEffect(() => {
    if (session) {
      fetchStats();
      fetchMarket();
      const interval = setInterval(fetchMarket, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [session]);

  const handlePay = async (actionType: string, billId?: string) => {
    setLoading(billId || actionType);
    try {
      const action = actionType === 'pay_all' ? 'payAll' : 'payBill';
      const type = billId === 'Electricity' ? 'electricity' : 
                   billId === 'Water Supply' ? 'water' : 
                   billId === 'Property Tax' ? 'tax' : undefined;

      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.stats) setUserStats(data.stats);
        else fetchStats();
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleTrade = async (action: 'buyAsset' | 'sellAsset') => {
    const rawPrice = marketData.prices[selectedAsset];
    const pricePerUnit = selectedAsset === 'business' ? rawPrice / 100 : rawPrice;
    
    setLoading('trading');
    try {
      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          assetId: selectedAsset, 
          quantity: tradeAmount,
          pricePerUnit 
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        alert(data.error || "Trade failed");
      }
    } catch (err) {
      console.error("Trade error:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('donating');
    setDonationStatus(null);
    try {
      const res = await fetch("/api/user/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUsername: donateUsername, amount: donateAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setDonationStatus("Success! " + data.message);
        fetchStats();
        setTimeout(() => {
          setIsDonating(false);
          setDonationStatus(null);
        }, 3000);
      } else {
        setDonationStatus("Error: " + data.error);
      }
    } catch (err) {
      setDonationStatus("Error: Connection failed");
    } finally {
      setLoading(null);
    }
  };

  const handlePurchase = async (itemId: string, cost: number) => {
    if ((userStats?.coins || 0) < cost) {
      alert("Insufficient coins!");
      return;
    }
    setLoading(itemId);
    try {
      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'purchase', itemId }),
      });
      const data = await res.json();
      if (data.success) fetchStats();
      else alert(data.error || "Purchase failed");
    } finally {
      setLoading(null);
    }
  };

  const askCribby = async (customMessage?: string) => {
    const input = customMessage || assistantInput;
    if (!input.trim()) return;

    const newMessages = [...cribbyMessages, { role: 'user', content: input }];
    setCribbyMessages(newMessages);
    setAssistantInput("");
    setIsAssistantTyping(true);
    setIsAssistantOpen(true);

    try {
      const res = await fetch("/api/market/cribby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, marketData }),
      });
      const data = await res.json();
      if (data.message) {
        setCribbyMessages([...newMessages, data.message]);
      }
    } catch (err) {
      console.error("Cribby failed:", err);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const handleExplainMe = () => {
    askCribby("Can you explain how this marketplace works and give me some advice on what to do next based on my current stats?");
  };

  const age = useMemo(() => {
    if (!userStats?.dob) return 18;
    const birthDate = new Date(userStats.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [userStats?.dob]);

  const isJunior = age < 13;

  // Auto-switch away from stocks if Junior
  useEffect(() => {
    if (isJunior && activeTab === 'stocks') setActiveTab('portfolio');
  }, [isJunior, activeTab]);

  if (!userStats || !marketData) {
     return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
           <Loader2 className="w-10 h-10 animate-spin text-primary" />
           <p className="text-text-tertiary font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing with Global Markets...</p>
        </div>
     );
  }

  const coins = userStats.coins || 0;
  const assets = userStats.assets || {};
  const netWorth = coins + 
    (assets.gold || 0) * marketData.prices.gold + 
    (assets.silver || 0) * marketData.prices.silver + 
    (assets.cnc500 || 0) * marketData.prices.cnc500 + 
    (assets.business || 0) * (marketData.prices.business / 100) + 
    (assets.property || 0) * marketData.prices.property;

  // Generate chart data
  const chartData = Array.from({ length: 20 }, (_, i) => ({
    name: i,
    value: marketData.prices[selectedAsset] * (1 + (Math.sin(i / 2) * 0.02) + (Math.random() * 0.01 - 0.005))
  }));

  const assetLabels: any = {
    gold: "Gold Bullion",
    silver: "Silver Bullion",
    cnc500: "CNC 500 Index",
    business: "Business Equity",
    property: "Real Estate"
  };

  const assetUnits: any = {
    gold: "oz",
    silver: "oz",
    cnc500: "Shares",
    business: "% Equity",
    property: "Units"
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-6 md:p-10 animate-fade-in pb-32">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <Activity className="w-3 h-3 animate-pulse" /> Live Economy Active
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter">
            Market <span className="text-primary">Hub.</span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-card border border-card-border p-1.5 rounded-2xl shadow-xl w-fit">
              <TabButton active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} icon={Wallet} label="Portfolio" />
              {!isJunior && <TabButton active={activeTab === 'stocks'} onClick={() => setActiveTab('stocks')} icon={BarChart3} label="Terminal" />}
              <TabButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={ShoppingCart} label={isJunior ? "Prize Hub" : "The Store"} />
            </div>

            <button 
              onClick={() => setIsDonating(true)}
              className="flex items-center gap-2 px-6 py-4 bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
            >
              <Send className="w-4 h-4" /> Send Gift
            </button>

            <button 
              onClick={handleExplainMe}
              className="flex items-center gap-2 px-6 py-4 bg-primary/10 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
            >
              <Sparkles className="w-4 h-4" /> Explain Platform
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Total Net Worth</p>
           <h3 className="text-4xl font-black text-text-primary tracking-tighter">${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
           <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
              <ArrowUpRight className="w-3 h-3" /> Wealth Tracking Active
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'portfolio' && (
          <motion.div 
            key="portfolio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {/* Liquid Wealth Card */}
            <div className="md:col-span-2 bento-card bg-primary text-white border-none p-10 flex flex-col justify-between h-[320px] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
               <div className="flex justify-between items-start relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl">
                     <Coins className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Global Rank</p>
                    <span className="text-2xl font-black">#{userStats.globalRank || '??'}</span>
                  </div>
               </div>
               <div className="relative z-10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Liquid Cash Balance</p>
                  <h3 className="text-7xl font-black tracking-tighter">${coins.toLocaleString()}</h3>
                  <p className="text-sm font-bold text-white/40 mt-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Available for immediate investment
                  </p>
               </div>
            </div>

            {/* Utility Bills (Necessities) */}
            <div className="md:col-span-1 lg:col-span-2 bento-card p-0 overflow-hidden bg-card border-card-border shadow-xl">
               <div className="p-8 border-b border-card-border flex justify-between items-center bg-primary/5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-3">
                      <Zap className="w-6 h-6 text-orange-500" /> Essential Bills
                    </h3>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Keep your status "Active"</p>
                  </div>
                  <button 
                    onClick={() => handlePay('pay_all')}
                    className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20"
                  >
                    Pay All
                  </button>
               </div>
               <div className="divide-y divide-card-border custom-scrollbar">
                  <BillItem title="Electricity" cost={200} status={userStats.electricityStatus} onPay={() => handlePay('pay_single', 'Electricity')} loading={loading === 'Electricity'} icon={Zap} color="text-orange-500" hasSmartMeter={userStats.purchasedItems?.includes('smart_meter')} />
                  <BillItem title="Water Supply" cost={150} status={userStats.waterStatus} onPay={() => handlePay('pay_single', 'Water Supply')} loading={loading === 'Water Supply'} icon={Droplets} color="text-blue-500" hasSmartMeter={userStats.purchasedItems?.includes('smart_meter')} />
                  <BillItem title="Property Tax" cost={300} status={userStats.taxStatus} onPay={() => handlePay('pay_single', 'Property Tax')} loading={loading === 'Property Tax'} icon={Flag} color="text-emerald-500" />
               </div>
            </div>

            {/* Asset Breakdown */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
               <AssetCard title="Gold Bullion" value={assets.gold || 0} unit="oz" price={marketData.prices.gold} icon={Coins} color="text-accent-gold" />
               <AssetCard title="Silver Bullion" value={assets.silver || 0} unit="oz" price={marketData.prices.silver} icon={TrendingUp} color="text-slate-400" />
               <AssetCard title="CNC 500 Index" value={assets.cnc500 || 0} unit="Shares" price={marketData.prices.cnc500} icon={Globe} color="text-purple-500" />
               <AssetCard title="Business Equity" value={assets.business || 0} unit="%" price={marketData.prices.business / 100} icon={Building2} color="text-blue-500" />
               <AssetCard title="Real Estate" value={assets.property || 0} unit="Units" price={marketData.prices.property} icon={Landmark} color="text-emerald-500" />
            </div>
          </motion.div>
        )}

        {activeTab === 'stocks' && (
          <motion.div 
            key="stocks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Market Chart */}
            <div className="lg:col-span-2 bento-card bg-card border-card-border p-8 space-y-8 flex flex-col">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase">{assetLabels[selectedAsset]}</h3>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Real-time performance tracker</p>
                  </div>
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <button 
                      onClick={fetchMarket}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1 bg-background p-1 rounded-xl border border-card-border overflow-x-auto custom-scrollbar">
                      {['gold', 'silver', 'cnc500', 'business', 'property'].map(id => (
                        <button 
                          key={id}
                          onClick={() => setSelectedAsset(id as any)}
                          className={clsx(
                            "px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap",
                            selectedAsset === id ? "bg-primary text-white shadow-lg" : "text-text-tertiary hover:text-text-primary"
                          )}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="h-[300px] w-full bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '1rem' }}
                        itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>

               {/* Daily Tips */}
               <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex gap-5 items-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                     <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">AI-Powered Market Tip</p>
                    <p className="text-sm font-bold text-text-secondary leading-relaxed">
                      {marketData.tips[Math.floor(Date.now() / 86400000) % marketData.tips.length]}
                    </p>
                  </div>
               </div>
            </div>

            {/* Trading Panel */}
            <div className="bento-card bg-card border-card-border p-8 flex flex-col gap-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black text-text-primary uppercase tracking-tight">Trade {selectedAsset}</h4>
                    <span className={clsx(
                      "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                      marketData.prices.trends[selectedAsset] >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {marketData.prices.trends[selectedAsset] >= 0 ? '+' : ''}{marketData.prices.trends[selectedAsset].toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-6 bg-background rounded-2xl border border-card-border text-center space-y-1">
                     <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                       {selectedAsset === 'business' ? 'Price per 1% Equity' : 'Current Price per Unit'}
                     </p>
                      <h5 className="text-4xl font-black text-text-primary tracking-tighter">
                        ${(marketData.prices[selectedAsset] / (selectedAsset === 'business' ? 100 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </h5>
                     {selectedAsset === 'business' && (
                       <p className="text-[8px] font-bold text-primary uppercase mt-1">Per 1.00% Equity</p>
                     )}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                     <span>{assetUnits[selectedAsset]} to trade</span>
                     <span>Total: ${(tradeAmount * (marketData.prices[selectedAsset] / (selectedAsset === 'business' ? 100 : 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-background p-2 rounded-2xl border border-card-border">
                     <button onClick={() => setTradeAmount(Math.max(1, tradeAmount - 1))} className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center font-black text-xl hover:bg-primary hover:text-white transition-all">-</button>
                     <input 
                        type="number" 
                        value={tradeAmount} 
                        max={selectedAsset === 'business' ? 100 : undefined}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setTradeAmount(selectedAsset === 'business' ? Math.min(100, val) : val);
                        }}
                        className="flex-1 bg-transparent text-center font-black text-lg outline-none"
                     />
                     <button onClick={() => setTradeAmount(tradeAmount + 1)} className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center font-black text-xl hover:bg-primary hover:text-white transition-all">+</button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-auto">
                  <button 
                    onClick={() => handleTrade('buyAsset')}
                    disabled={loading === 'trading'}
                    className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading === 'trading' ? '...' : 'Buy'}
                  </button>
                  <button 
                    onClick={() => handleTrade('sellAsset')}
                    disabled={loading === 'trading'}
                    className="py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading === 'trading' ? '...' : 'Sell'}
                  </button>
               </div>
               
               <div className="flex items-center gap-3 justify-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                  <Briefcase className="w-4 h-4" /> You own {userStats.assets[selectedAsset] || 0} {assetUnits[selectedAsset]}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'store' && (
          <motion.div 
            key="store"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Necessities (Needs) */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <SectionHeader title="Essentials (Needs)" icon={ShieldCheck} />
                <p className="text-xs font-bold text-text-tertiary max-w-md">Items in this category help you save coins and improve your long-term stability.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ShopCard 
                  title="Solar Panel Array" 
                  desc="Permanently reduce electricity bills by 30%" 
                  price={5000} 
                  icon={Leaf} 
                  category="Infrastructure"
                  onClick={() => handlePurchase('solar_panels', 5000)}
                  loading={loading === 'solar_panels'}
                  isOwned={userStats.purchasedItems?.includes('solar_panels')}
                  isNeed
                  pros={["30% Electricity Bill reduction", "Sustainable energy source"]}
                  cons={["High initial investment"]}
                />
                <ShopCard 
                  title="Wind Turbine" 
                  desc="Reduce electricity bills by 40%. High cost, high reward." 
                  price={7500} 
                  icon={Zap} 
                  category="Infrastructure"
                  onClick={() => handlePurchase('wind_turbine', 7500)}
                  loading={loading === 'wind_turbine'}
                  isOwned={userStats.purchasedItems?.includes('wind_turbine')}
                  isNeed
                  pros={["40% Electricity Bill reduction", "Constant power generation"]}
                  cons={["Premium pricing", "Space intensive"]}
                />
                <ShopCard 
                  title="Smart Metering" 
                  desc="Real-time usage stats & waste reduction" 
                  price={1500} 
                  icon={Zap} 
                  category="Infrastructure"
                  onClick={() => handlePurchase('smart_meter', 1500)}
                  loading={loading === 'smart_meter'}
                  isOwned={userStats.purchasedItems?.includes('smart_meter')}
                  isNeed
                  pros={["Real-time statistics", "Eliminates energy waste"]}
                  cons={["Initial configuration required"]}
                />
              </div>
            </section>

            {/* Luxuries (Wants) */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <SectionHeader title={isJunior ? "Junior Collectibles" : "Luxuries (Wants)"} icon={Star} />
                <p className="text-xs font-bold text-text-tertiary max-w-md">
                   {isJunior ? "Trade your hard-earned coins for epic prizes!" : "Enhance your experience and show off your success. These are nice to have!"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isJunior ? (
                  <>
                    <ShopCard title="Epic Sticker Pack" desc="Show off on your profile with cool stickers" price={300} icon={Sparkles} category="Collection" onClick={() => handlePurchase('stickers_1', 300)} isOwned={userStats.purchasedItems?.includes('stickers_1')} pros={["Unique social flair", "Tradeable assets"]} cons={["Purely cosmetic"]} />
                    <ShopCard title="Rainbow Trail" icon={TrendingUp} desc="Leaves a rainbow trail when you move in 3D" price={800} category="VFX" onClick={() => handlePurchase('trail_rainbow', 800)} isOwned={userStats.purchasedItems?.includes('trail_rainbow')} pros={["Premium visual effect", "Dynamic movement"]} cons={["Can be distracting"]} />
                    <ShopCard title="Pet Dragon Egg" icon={Activity} desc="A legendary companion for your home" price={5000} category="Pets" onClick={() => handlePurchase('dragon_egg', 5000)} isOwned={userStats.purchasedItems?.includes('dragon_egg')} pros={["Ultra-rare companion", "Maximum status"]} cons={["Long hatching period"]} />
                    <ShopCard title="Golden Nameplate" icon={Trophy} desc="Stand out in the global rankings" price={1200} category="Social" onClick={() => handlePurchase('gold_name', 1200)} isOwned={userStats.purchasedItems?.includes('gold_name')} pros={["Leaderboard prestige", "Permanent unlock"]} cons={["No functional boost"]} />
                  </>
                ) : (
                  <>
                    <ShopCard title="AI Turbo Boost" desc="Unlock high-priority AI processing for 24h" price={500} icon={Zap} category="Productivity" onClick={() => handlePurchase('ai_turbo', 500)} isOwned={userStats.purchasedItems?.includes('ai_turbo')} pros={["Faster response times", "Priority AI features"]} cons={["Temporary (24h)"]} />
                    <ShopCard title="Zen Focus Ambiance" desc="Unlock premium focus soundscapes" price={450} icon={Activity} category="Focus" onClick={() => handlePurchase('zen_ambiance', 450)} isOwned={userStats.purchasedItems?.includes('zen_ambiance')} pros={["Immersive focus", "Variety of themes"]} cons={["Requires headphones for best experience"]} />
                    <ShopCard title="Deep Work Timer" desc="Custom pomodoro widget" price={800} icon={Activity} category="Focus" onClick={() => handlePurchase('focus_timer', 800)} isOwned={userStats.purchasedItems?.includes('focus_timer')} pros={["Science-backed focus", "Custom intervals"]} cons={["Requires manual start"]} />
                    <ShopCard title="Export License" desc="Export crib as high-res PDF" price={1200} icon={ArrowUpRight} category="Creator" onClick={() => handlePurchase('pdf_export', 1200)} isOwned={userStats.purchasedItems?.includes('pdf_export')} pros={["Shareable portfolio", "High resolution"]} cons={["Single-format export"]} />
                  </>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation Modal */}
      <AnimatePresence>
        {isDonating && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDonating(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-card border border-card-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black tracking-tighter">Gift Coins</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Help a friend & gain XP</p>
                 </div>
                 <button onClick={() => setIsDonating(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleDonate} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Recipient Username</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-purple-600 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={donateUsername}
                        onChange={(e) => setDonateUsername(e.target.value)}
                        placeholder="Who is the lucky friend?"
                        className="w-full h-14 bg-background border border-card-border rounded-2xl pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Amount to Gift</label>
                    <div className="relative group">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-gold" />
                      <input 
                        type="number" 
                        required
                        min={1}
                        max={coins}
                        value={donateAmount}
                        onChange={(e) => setDonateAmount(parseInt(e.target.value) || 0)}
                        className="w-full h-14 bg-background border border-card-border rounded-2xl pl-12 pr-4 font-black text-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                      />
                    </div>
                    <div className="flex justify-between px-1">
                       <span className="text-[10px] font-bold text-text-tertiary">Balance: {coins.toLocaleString()}</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+ {Math.floor(donateAmount / 10)} XP Reward</span>
                    </div>
                 </div>

                 {donationStatus && (
                   <div className={clsx(
                     "p-4 rounded-2xl text-xs font-bold animate-in zoom-in-95",
                     donationStatus.startsWith("Success") ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                   )}>
                     {donationStatus}
                   </div>
                 )}

                 <button 
                   type="submit"
                   disabled={loading === 'donating'}
                   className="w-full h-14 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                 >
                   {loading === 'donating' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Gift Now"}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cribby Assistant */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isAssistantOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[350px] md:w-[400px] h-[500px] bg-card border border-card-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-primary text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 overflow-hidden">
                    <img src="/cribby-excited.png" alt="Cribby" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[10px] uppercase tracking-widest leading-none">Market Guide</span>
                    <span className="font-black text-sm uppercase tracking-tighter">Cribby</span>
                  </div>
                </div>
                <button onClick={() => setIsAssistantOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-primary/5">
                {cribbyMessages.map((msg, i) => (
                  <div key={i} className={clsx(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-white border border-card-border flex-shrink-0 overflow-hidden shadow-sm">
                        <img src="/cribby-excited.png" alt="Cribby" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className={clsx(
                      "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-primary text-white rounded-tr-none shadow-lg" 
                        : "bg-white border border-card-border text-text-secondary rounded-tl-none shadow-sm"
                    )}>
                      <div className="prose prose-sm prose-p:my-0 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isAssistantTyping && (
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cribby is thinking...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-background border-t border-card-border flex gap-2">
                <input 
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askCribby()}
                  placeholder="Ask Cribby anything..."
                  className="flex-1 bg-card border border-card-border rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button 
                  onClick={() => askCribby()}
                  disabled={isAssistantTyping}
                  className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          className={clsx(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-90 overflow-hidden p-1 border-4",
            isAssistantOpen ? "bg-card border-card-border" : "bg-primary border-primary/20"
          )}
        >
          {isAssistantOpen ? <X className="w-8 h-8 text-primary" /> : <img src="/cribby-excited.png" alt="Cribby" className="w-full h-full object-contain" />}
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
        active ? "bg-primary text-white shadow-lg" : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
      )}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function BillItem({ title, cost, status, onPay, loading, icon: Icon, color, hasSmartMeter }: any) {
  const isPaid = status === 'Active' || status === 'Paid';
  return (
    <div className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all group border-b border-card-border last:border-0">
      <div className="flex items-center gap-4">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-primary/5", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-text-primary text-base">{title}</h5>
            {hasSmartMeter && title !== 'Property Tax' && (
              <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase animate-pulse">Smart Active</span>
            )}
          </div>
          <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">{cost} Coins</p>
        </div>
      </div>
      {isPaid ? (
        <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
           <CheckCircle className="w-5 h-5" /> Active
        </div>
      ) : (
        <button 
          onClick={onPay}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
        >
          {loading ? "..." : "Pay Now"}
        </button>
      )}
    </div>
  );
}

function AssetCard({ title, value, unit, price, icon: Icon, color }: any) {
  const totalValue = value * price;
  return (
    <div className="bento-card bg-card border-card-border p-6 flex flex-col gap-4 group hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-primary/5", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
           <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">{title}</p>
           <h4 className="text-xl font-black text-text-primary tracking-tighter">{value.toLocaleString()} {unit}</h4>
        </div>
      </div>
      <div className="pt-4 border-t border-card-border space-y-2">
         <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary">
            <span>Unit Price</span>
            <span className="text-text-primary">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
         </div>
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-text-secondary">Current Total</p>
            <p className="text-sm font-black text-text-primary">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
         </div>
      </div>
    </div>
  );
}

function ShopCard({ title, desc, price, icon: Icon, category, onClick, loading, isOwned, isNeed, pros = [], cons = [] }: any) {
  return (
    <div className={clsx(
      "bento-card p-8 flex flex-col justify-between hover:border-primary transition-all group relative overflow-hidden",
      isOwned ? "bg-primary/5 border-primary/20" : "bg-card border-card-border",
      isNeed && !isOwned && "border-l-4 border-l-emerald-500"
    )}>
      {isNeed && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
           Need
        </div>
      )}
      
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-start">
           <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", isOwned ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
              {isOwned ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
           </div>
           <span className="text-[10px] font-black text-primary uppercase tracking-widest">{category}</span>
        </div>
        <div>
           <h4 className="text-xl font-black text-text-primary leading-tight">{title}</h4>
           <p className="text-sm font-bold text-text-secondary mt-1">{desc}</p>
        </div>

        {/* Pros & Cons */}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="pt-4 space-y-2 border-t border-card-border mt-4">
            {pros.map((p: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                <Check className="w-3 h-3" /> {p}
              </div>
            ))}
            {cons.map((c: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                <X className="w-3 h-3" /> {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent-gold" />
            <span className="text-2xl font-black text-text-primary tracking-tighter">{price.toLocaleString()}</span>
         </div>
         <button 
           onClick={!isOwned ? onClick : undefined}
           disabled={loading || isOwned}
           className={clsx(
             "px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
             isOwned 
               ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default" 
               : "bg-primary text-white hover:shadow-xl hover:-translate-y-1"
           )}
         >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isOwned ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {isOwned ? "Owned" : "Buy Now"}
         </button>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase">{title}</h3>
    </div>
  );
}
