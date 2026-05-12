"use client";

import React from "react";
import VirtualHome3D from "@/components/VirtualHome3D";
import { Home, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HomePreviewWidgetProps {
  level: number;
  purchasedItems: string[];
}

export function HomePreviewWidget({ level, purchasedItems }: HomePreviewWidgetProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary tracking-tight">Your Virtual Home</h4>
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Level {level} architecture</p>
          </div>
        </div>
        <Link href="/virtual-home" className="p-2 hover:bg-gray-50 rounded-lg transition-colors group">
          <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary" />
        </Link>
      </div>
      
      <div className="flex-1 min-h-0 p-4 pt-0">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-card-border shadow-inner bg-card-hover relative">
           <div className="absolute inset-0 z-10 pointer-events-none" />
           <VirtualHome3D homeLevel={level} purchasedItems={purchasedItems} />
        </div>
      </div>
    </div>
  );
}
