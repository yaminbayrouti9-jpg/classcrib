"use client";

import React, { useState, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { 
  Plus, 
  Settings2, 
  X, 
  GripVertical, 
  Layout, 
  Save,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { WIDGET_REGISTRY, WidgetMetadata } from './WidgetRegistry';
import clsx from 'clsx';

// Import widget components
import { 
  ActivityPulseWidget, 
  WealthInsightWidget, 
  EcoImpactWidget, 
  GrowthChartWidget 
} from './widgets/PerformanceWidgets';
import { LeaderboardWidget, CommunityPulseWidget } from './widgets/SocialWidgets';
import { DailyQuestsWidget, StudyBuddyWidget, AchievementHallWidget } from './widgets/EngagementWidgets';
import { DeadlineRadarWidget, FocusTimerWidget, QuickNotesWidget, ZenAmbianceWidget } from './widgets/UtilityWidgets';
import { HomePreviewWidget } from './widgets/GameWidgets';

interface DashboardWidget {

  id: string;
  type: string;
  size: 'sm' | 'md' | 'lg' | 'full';
}

interface CustomizableDashboardProps {
  initialLayout: DashboardWidget[];
  data: any; // All data needed for widgets
  userRole: 'Student' | 'Teacher';
}

export default function CustomizableDashboard({ initialLayout, data, userRole }: CustomizableDashboardProps) {
  const [layout, setLayout] = useState<DashboardWidget[]>(initialLayout);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLayout = localStorage.getItem(`classcrib-dashboard-layout-${userRole}`);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed);
        }
      } catch (e) {
        console.error("Failed to load dashboard layout", e);
      }
    }
  }, [userRole]);

  const saveLayout = () => {
    localStorage.setItem(`classcrib-dashboard-layout-${userRole}`, JSON.stringify(layout));
    setIsEditing(false);
  };

  const removeWidget = (id: string) => {
    setLayout(prev => prev.filter(w => w.id !== id));
  };

  const addWidget = (type: string) => {
    const meta = WIDGET_REGISTRY[type];
    const newWidget: DashboardWidget = {
      id: `${type}-${Date.now()}`,
      type,
      size: meta.defaultSize
    };
    setLayout(prev => [...prev, newWidget]);
    setShowAddModal(false);
  };

  const resizeWidget = (id: string) => {
    setLayout(prev => prev.map(w => {
      if (w.id !== id) return w;
      const sizes: ('sm' | 'md' | 'lg' | 'full')[] = ['sm', 'md', 'lg', 'full'];
      const currentIndex = sizes.indexOf(w.size);
      const nextSize = sizes[(currentIndex + 1) % sizes.length];
      return { ...w, size: nextSize };
    }));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Dashboard Toolbar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
           <div className={clsx(
             "px-4 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer",
             isEditing ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-text-secondary border-card-border hover:border-text-tertiary"
           )} onClick={() => isEditing ? saveLayout() : setIsEditing(true)}>
              {isEditing ? <Save className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
              <span className="text-xs font-bold">{isEditing ? 'Save Layout' : 'Edit Dashboard'}</span>
           </div>
           {isEditing && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="px-4 py-2 bg-card text-primary border border-card-border rounded-xl flex items-center gap-2 hover:bg-card-hover transition-all text-xs font-bold shadow-sm"
             >
                <Plus className="w-4 h-4" /> Add Widget
             </button>
           )}
           {userRole === 'Student' && (
             <button 
               onClick={() => (window as any).showJoinModal?.()}
               className="px-4 py-2 bg-primary text-white rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-all text-xs font-bold shadow-lg shadow-primary/20"
             >
                <Plus className="w-4 h-4" /> Join Class
             </button>
           )}
        </div>
      </div>

      {/* Grid Layout */}
      <Reorder.Group 
        axis="y" 
        values={layout} 
        onReorder={setLayout}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {layout.map((widget) => (
          <WidgetWrapper 
            key={widget.id} 
            widget={widget} 
            isEditing={isEditing}
            onRemove={() => removeWidget(widget.id)}
            onResize={() => resizeWidget(widget.id)}
            data={data}
          />
        ))}
      </Reorder.Group>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-card border border-card-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
           >
              <div className="p-6 border-b border-card-border flex justify-between items-center bg-card">
                 <h3 className="text-xl font-bold text-text-primary">Add Widget</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-text-tertiary hover:text-text-primary"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 no-scrollbar">
                 {Object.values(WIDGET_REGISTRY)
                   .filter(meta => meta.roles.includes(userRole))
                   .map((meta) => (
                    <button
                      key={meta.id}
                      onClick={() => addWidget(meta.id)}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-card-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    >
                       <div className="w-12 h-12 bg-card-hover rounded-xl flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                          <meta.icon className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-text-primary">{meta.title}</p>
                          <p className="text-[10px] text-text-tertiary font-medium">{meta.description}</p>
                       </div>
                    </button>
                 ))}
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function WidgetWrapper({ widget, isEditing, onRemove, onResize, data }: { widget: DashboardWidget, isEditing: boolean, onRemove: () => void, onResize: () => void, data: any }) {
  const controls = useDragControls();
  
  const sizeClasses = {
    sm: "col-span-1 h-[220px]",
    md: "col-span-1 md:col-span-2 h-[220px]",
    lg: "col-span-1 md:col-span-2 lg:col-span-2 h-[400px]",
    full: "col-span-1 md:col-span-2 lg:col-span-4 h-[400px]"
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'activity_pulse': return <ActivityPulseWidget data={data.activityPulse || []} />;
      case 'home_preview': return <HomePreviewWidget level={data.homeLevel || 1} purchasedItems={data.purchasedItems || []} />;
      case 'wealth_insight': return <WealthInsightWidget income={data.income || 0} expense={data.expense || 0} balance={data.balance || 0} />;

      case 'eco_impact': return <EcoImpactWidget xp={data.ecoXp || 0} level={data.ecoLevel || 1} />;
      case 'growth_chart': return <GrowthChartWidget data={data.growthData || []} />;
      case 'leaderboard': return <LeaderboardWidget students={data.topStudents || []} />;
      case 'daily_quests': return <DailyQuestsWidget quests={data.quests || []} />;
      case 'study_buddy': return <StudyBuddyWidget status={data.buddyStatus || "Online"} />;
      case 'achievement_hall': return <AchievementHallWidget badges={data.badges || []} />;
      case 'deadline_radar': return <DeadlineRadarWidget deadlines={data.deadlines || []} />;
      case 'community_pulse': return <CommunityPulseWidget activities={data.communityActivity || []} />;
      case 'focus_timer': return <FocusTimerWidget isLocked={!data.purchasedItems?.includes('focus_timer')} />;
      case 'zen_ambiance': return <ZenAmbianceWidget isLocked={!data.purchasedItems?.includes('zen_ambiance')} />;
      case 'quick_notes': return <QuickNotesWidget />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-text-tertiary opacity-40 italic">
          <p className="text-xs">Widget {widget.type} coming soon...</p>
        </div>
      );
    }
  };

  return (
    <Reorder.Item 
      value={widget} 
      dragListener={isEditing}
      dragControls={controls}
      className={clsx(
        "bento-card group relative transition-all",
        sizeClasses[widget.size],
        isEditing && "ring-2 ring-primary ring-offset-4 ring-offset-background cursor-grab active:cursor-grabbing"
      )}
    >
      {isEditing && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
           <button onClick={onResize} className="p-1.5 bg-card border border-card-border rounded-lg text-text-tertiary hover:text-primary transition-all shadow-sm">
              <Maximize2 className="w-3 h-3" />
           </button>
           <button onClick={onRemove} className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 hover:bg-rose-500 transition-all shadow-sm group/del">
              <Trash2 className="w-3 h-3 group-hover/del:text-white" />
           </button>
           <div 
             onPointerDown={(e) => controls.start(e)}
             className="p-1.5 bg-card border border-card-border rounded-lg text-text-tertiary cursor-grab active:cursor-grabbing"
           >
              <GripVertical className="w-3 h-3" />
           </div>
        </div>
      )}
      <div className="h-full w-full overflow-hidden">
        {renderWidgetContent()}
      </div>
    </Reorder.Item>
  );
}
