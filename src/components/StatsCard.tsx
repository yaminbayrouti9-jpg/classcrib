import { ArrowUpRight, TrendingUp, Wallet, Zap } from "lucide-react";
import { clsx } from "clsx";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: any;
  iconBg: string;
  trend?: "up" | "down";
}

export default function StatsCard({ title, value, change, icon: Icon, iconBg, trend = "up" }: StatsCardProps) {
  return (
    <div className="glass p-6 flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", iconBg)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
          trend === "up" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        )}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {change}
        </div>
      </div>
      
      <div>
        <p className="text-text-secondary font-semibold text-sm mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-text-primary">{value}</h3>
      </div>
    </div>
  );
}
