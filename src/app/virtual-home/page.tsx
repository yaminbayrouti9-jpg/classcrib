"use client";

import {
  Home as HomeIcon,
  Leaf,
  Zap,
  Droplets,
  Trees,
  Flag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  Loader2,
  Sun,
  ShoppingBag,
  Coins,
  ShieldCheck,
  Trophy
} from "lucide-react";


import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import VirtualHome3D from "@/components/VirtualHome3D";
import CribbyTip from "@/components/ai/CribbyTip";
import HomeUpgradePopover from "@/components/HomeUpgradePopover";


export default function VirtualHomePage() {
  const { data: session } = useSession();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showUpgradePopover, setShowUpgradePopover] = useState<{ level: number } | null>(null);

  const fetchStats = async () => {
    const res = await fetch("/api/user/stats");

    const data = await res.json();
    if (data.success) setUserStats(data.stats);
  };


  useEffect(() => {
    if (session) fetchStats();
  }, [session]);

  const handleUpgrade = async () => {
    setLoading('upgrade');
    try {
      const res = await fetch("/api/user/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: 'upgrade' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowUpgradePopover({ level: (userStats?.homeLevel || 1) + 1 });
        fetchStats();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handlePurchase = async (title: string, cost: number) => {
    setLoading(title);
    try {
      const res = await fetch("/api/user/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: 'purchase', itemTitle: title, cost }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const homeLevel = userStats?.homeLevel || 1;
  const upgradeCost = homeLevel * 500;
  const ownedAssets = userStats?.purchasedItems || [];
  const electricityStatus = userStats?.electricityStatus || 'Active';

  const payBill = async (type: string) => {
    setLoading(type);
    try {
      const res = await fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'payBill', type }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.stats) {
          setUserStats(data.stats);
        } else {
          fetchStats();
        }
      } else {
        alert(data.error);
      }

    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-primary/30">
            <HomeIcon className="w-3 h-3" /> Property Manager
          </div>
          <h2 className="text-5xl font-black text-text-primary tracking-tighter">My Virtual Home</h2>
          <p className="text-text-secondary font-bold text-lg">Manage your utilities, taxes, and upgrades.</p>
        </div>

        <CribbyTip />

        <div className="flex items-center gap-4">
          <div className={clsx(
            "px-6 py-3 rounded-2xl border-2 font-black text-xl shadow-xl flex items-center gap-3",
            (userStats?.coins || 0) < 0 
              ? "bg-rose-500/10 border-rose-500 text-rose-500" 
              : "bg-amber-500/10 border-amber-500 text-amber-500"
          )}>
            <Coins className="w-6 h-6" /> {userStats?.coins?.toLocaleString()} Coins
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bento-card p-0 h-[650px] flex flex-col relative group overflow-hidden border-card-border shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-card pointer-events-none dark:from-primary/20 dark:to-card" />
            <div className="flex-1 w-full relative z-10">
                <VirtualHome3D 
                  homeLevel={homeLevel} 
                  purchasedItems={ownedAssets} 
                  electricityStatus={electricityStatus}
                />
             </div>

            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-card border-t border-card-border z-20">
              <div className="space-y-2 flex-1 w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-text-primary text-2xl tracking-tighter">Crib Level {homeLevel}</span>
                  <span className="text-text-secondary font-black text-[10px] uppercase tracking-widest">Upgrade for {upgradeCost} Coins</span>
                </div>
                <div className="h-3 w-full bg-card-hover rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min((homeLevel / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={loading === 'upgrade' || (userStats?.coins || 0) < upgradeCost}
                className="btn btn-primary h-14 px-10 text-lg shadow-xl shadow-primary/20 min-w-[240px] flex items-center justify-center"
              >
                {loading === 'upgrade' ? <Loader2 className="animate-spin" /> : <>Upgrade Level <Sparkles className="w-5 h-5 ml-3" /></>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <UtilityCard 
               title="Electricity" 
               status={electricityStatus} 
               cost={200} 
               discount={ownedAssets.includes('Tesla Powerwall') ? 0.2 : (ownedAssets.includes('Solar Battery') ? 0.5 : 1)}
               icon={Zap} 
               onPay={() => payBill('electricity')}
               loading={loading === 'electricity'}
               dueDays={userStats?.dueDates?.electricity}
             />
             <UtilityCard 
               title="Water Bill" 
               status={userStats?.waterStatus || 'Active'} 
               cost={150} 
               discount={ownedAssets.includes('Off-Grid Purifier') ? 0.2 : (ownedAssets.includes('Water Reservoir') ? 0.5 : 1)}
               icon={Droplets} 
               onPay={() => payBill('water')}
               loading={loading === 'water'}
               dueDays={userStats?.dueDates?.water}
             />
             <UtilityCard 
               title="Property Tax" 
               status={userStats?.taxStatus || 'Paid'} 
               cost={300} 
               discount={ownedAssets.includes('Tax Consultant') ? 0.8 : 1}
               icon={Flag} 
               onPay={() => payBill('tax')}
               loading={loading === 'tax'}
               dueDays={userStats?.dueDates?.tax}
             />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bento-card student-accent">
            <h4 className="text-xl font-black text-text-primary mb-6 tracking-tight">Crib Shop</h4>
            <div className="space-y-6">
              <ShopBentoItem title="Backyard Garden" cost={500} icon={Trees} color="text-green-500" owned={ownedAssets.includes('Backyard Garden')} onPurchase={() => handlePurchase('Backyard Garden', 500)} loading={loading === 'Backyard Garden'} />
              <ShopBentoItem title="Solar Array" cost={1200} icon={Sun} color="text-orange-400" owned={ownedAssets.includes('Solar Array')} onPurchase={() => handlePurchase('Solar Array', 1200)} loading={loading === 'Solar Array'} />

              <div className="h-px bg-card-border my-4" />
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Level Upgrades</p>

              <ShopBentoItem title="Solar Battery" cost={2000} icon={Zap} color="text-amber-500" owned={ownedAssets.includes('Solar Battery')} onPurchase={() => handlePurchase('Solar Battery', 2000)} loading={loading === 'Solar Battery'} levelReq={5} currentLevel={userStats?.level} />
              <ShopBentoItem title="Water Reservoir" cost={1800} icon={Droplets} color="text-blue-500" owned={ownedAssets.includes('Water Reservoir')} onPurchase={() => handlePurchase('Water Reservoir', 1800)} loading={loading === 'Water Reservoir'} levelReq={8} currentLevel={userStats?.level} />
              <ShopBentoItem title="Tax Consultant" cost={3500} icon={ShieldCheck} color="text-indigo-500" owned={ownedAssets.includes('Tax Consultant')} onPurchase={() => handlePurchase('Tax Consultant', 3500)} loading={loading === 'Tax Consultant'} levelReq={12} currentLevel={userStats?.level} />

              <ShopBentoItem title="Sports Zone" cost={2500} icon={Flag} color="text-red-400" owned={ownedAssets.includes('Sports Zone')} onPurchase={() => handlePurchase('Sports Zone', 2500)} loading={loading === 'Sports Zone'} levelReq={15} currentLevel={userStats?.level} />
              <ShopBentoItem title="Gaming Setup" cost={1500} icon={Zap} color="text-purple-400" owned={ownedAssets.includes('Gaming Setup')} onPurchase={() => handlePurchase('Gaming Setup', 1500)} loading={loading === 'Gaming Setup'} levelReq={20} currentLevel={userStats?.level} />
              <ShopBentoItem title="Art Studio" cost={1800} icon={Sparkles} color="text-pink-400" owned={ownedAssets.includes('Art Studio')} onPurchase={() => handlePurchase('Art Studio', 1800)} loading={loading === 'Art Studio'} levelReq={25} currentLevel={userStats?.level} />

              <div className="h-px bg-card-border my-4" />
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Master Level Items</p>

              <ShopBentoItem title="Tesla Powerwall" cost={5000} icon={Zap} color="text-rose-600" owned={ownedAssets.includes('Tesla Powerwall')} onPurchase={() => handlePurchase('Tesla Powerwall', 5000)} loading={loading === 'Tesla Powerwall'} levelReq={35} currentLevel={userStats?.level} />
              <ShopBentoItem title="Off-Grid Purifier" cost={4500} icon={Droplets} color="text-cyan-500" owned={ownedAssets.includes('Off-Grid Purifier')} onPurchase={() => handlePurchase('Off-Grid Purifier', 4500)} loading={loading === 'Off-Grid Purifier'} levelReq={45} currentLevel={userStats?.level} />
              <ShopBentoItem title="Golden Statue" cost={10000} icon={Trophy} color="text-amber-500" owned={ownedAssets.includes('Golden Statue')} onPurchase={() => handlePurchase('Golden Statue', 10000)} loading={loading === 'Golden Statue'} levelReq={50} currentLevel={userStats?.level} />
            </div>
          </div>
        </div>
      </div>
      {showUpgradePopover && (
        <HomeUpgradePopover 
          level={showUpgradePopover.level} 
          onClose={() => setShowUpgradePopover(null)} 
        />
      )}
    </div>
  );
}


function UtilityCard({ title, status, cost, discount, icon: Icon, onPay, loading, dueDays }: any) {

  const finalCost = Math.floor(cost * discount);
  const isOverdue = status === 'Risk' || status === 'Cut' || status === 'Raid' || status === 'Overdue' || (dueDays !== undefined && dueDays <= 0);


  return (
    <div className={clsx(
      "bento-card p-6 flex flex-col gap-4 border-2 transition-all",
      isOverdue ? "bg-rose-500/10 border-rose-500/30" : "bg-card border-card-border shadow-lg"
    )}>
      <div className="flex justify-between items-start">
        <div className={clsx("p-3 rounded-2xl", isOverdue ? "bg-rose-500 text-white" : "bg-primary/10 text-primary")}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={clsx(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
          isOverdue ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
        )}>
          {isOverdue ? (status === 'Cut' || (dueDays !== undefined && dueDays <= 0) ? 'Overdue' : 'Risk') : status}
        </div>


      </div>

      <div>
        <h4 className="text-xl font-black text-text-primary tracking-tight">{title}</h4>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-tertiary line-through">{cost}</span>
            <span className="text-lg font-black text-primary">{finalCost} Coins</span>
          </div>
          {dueDays !== undefined && (
            <span className={clsx(
              "text-[10px] font-black uppercase tracking-widest",
              dueDays <= 0 ? "text-rose-500 animate-pulse" : "text-text-tertiary"
            )}>
              {dueDays <= 0 ? "" : `Due in ${dueDays}d`}
            </span>
          )}

        </div>
      </div>


      <button 
        onClick={onPay}
        disabled={loading || ((status === 'Active' || status === 'Paid') && dueDays > 7)}
        className={clsx(
          "w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
          ((status === 'Active' || status === 'Paid') && dueDays > 7) 
            ? "bg-card-hover text-text-tertiary cursor-not-allowed" 
            : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          ((status === 'Active' || status === 'Paid') && dueDays > 7) ? "Bill Up to Date" : "Pay Bill Now"
        )}
      </button>

    </div>
  );
}

function ShopBentoItem({ title, cost, icon: Icon, color, owned, onPurchase, loading, levelReq, currentLevel }: any) {
  const isLocked = levelReq && currentLevel < levelReq;

  return (
    <div className="flex items-center justify-between group/item">
      <div className="flex items-center gap-4">
        <div className={clsx("p-3 rounded-2xl bg-card-hover transition-colors", isLocked ? "opacity-30" : "group-hover/item:bg-card border border-card-border")}>
          <Icon className={clsx("w-5 h-5", color)} />
        </div>
        <div>
          <h5 className="text-sm font-black text-text-primary tracking-tight">{title}</h5>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-tertiary flex items-center gap-1">
              <Coins className="w-3 h-3" /> {cost}
            </span>
            {levelReq && (
              <span className={clsx(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                isLocked ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}>
                Lvl {levelReq}+
              </span>
            )}
          </div>
        </div>
      </div>
      {owned ? (
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
          <Check className="w-2.5 h-2.5" />
        </div>
      ) : (
        <button
          onClick={onPurchase}
          disabled={loading || isLocked}
          className={clsx(
            "p-2 rounded-xl transition-all",
            isLocked
              ? "bg-card-hover text-text-tertiary cursor-not-allowed"
              : "bg-card-hover text-text-tertiary hover:bg-primary hover:text-white"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLocked ? <Flag className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />)}
        </button>
      )}
    </div>
  );
}
