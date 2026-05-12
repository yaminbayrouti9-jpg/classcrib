"use client";

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart2, 
  Wallet, 
  Leaf, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Activity
} from 'lucide-react';
import clsx from 'clsx';

// Activity Pulse Widget
export function ActivityPulseWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Activity Pulse
          </h3>
          <p className="text-[10px] text-text-tertiary font-medium">Submission frequency (Last 7d)</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700 }} 
            />
            <Tooltip 
              cursor={{ fill: 'var(--card-hover)' }}
              contentStyle={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--card-border)',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '700'
              }}
            />
            <Bar 
              dataKey="count" 
              fill="var(--primary)" 
              radius={[6, 6, 0, 0]} 
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Wealth Insight Widget
export function WealthInsightWidget({ income, expense, balance }: { income: number, expense: number, balance: number }) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Balance</p>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">{balance.toLocaleString()} <span className="text-[10px] text-text-tertiary uppercase">CC</span></h2>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-card-border">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-text-tertiary uppercase">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Income
          </div>
          <p className="text-sm font-bold text-emerald-500">+{income}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-text-tertiary uppercase">
            <ArrowDownRight className="w-3 h-3 text-rose-500" /> Expense
          </div>
          <p className="text-sm font-bold text-rose-500">-{expense}</p>
        </div>
      </div>
    </div>
  );
}

// Eco Impact Widget
export function EcoImpactWidget({ xp, level }: { xp: number, level: number }) {
  const progress = Math.min((xp / (level * 1000)) * 100, 100);
  
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-center">
        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
          <Leaf className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">ECO LEVEL {level}</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-[10px] font-bold text-text-tertiary uppercase">Green Progress</p>
          <p className="text-xs font-black text-text-primary">{Math.round(progress)}%</p>
        </div>
        <div className="w-full h-2 bg-card-hover rounded-full overflow-hidden border border-card-border">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

// Growth Chart Widget
export function GrowthChartWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Growth Velocity
          </h3>
          <p className="text-[10px] text-text-tertiary font-medium">XP progression velocity</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 700 }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--card-border)',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '700'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="xp" 
              stroke="var(--primary)" 
              fillOpacity={1} 
              fill="url(#colorXp)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
