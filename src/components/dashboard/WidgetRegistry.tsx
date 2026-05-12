"use client";

import React from 'react';
import { 
  BarChart2, 
  Trophy, 
  Wallet, 
  Target, 
  Leaf, 
  Sparkles, 
  Clock, 
  Users, 
  Timer, 
  StickyNote, 
  TrendingUp, 
  Medal,
  CheckCircle2,
  Activity,
  Zap,
  Home,
  Music
} from 'lucide-react';


// Widget Types
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface WidgetMetadata {
  id: string;
  title: string;
  description: string;
  icon: any;
  defaultSize: WidgetSize;
  category: 'performance' | 'social' | 'utility' | 'engagement';
  roles: ('Student' | 'Teacher')[];
}

// Registry of available widgets
export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  activity_pulse: {
    id: 'activity_pulse',
    title: 'Activity Pulse',
    description: 'Real-time submission trends',
    icon: BarChart2,
    defaultSize: 'lg',
    category: 'performance',
    roles: ['Student', 'Teacher']
  },
  home_preview: {
    id: 'home_preview',
    title: 'Home Preview',
    description: '3D view of your virtual house',
    icon: Home,
    defaultSize: 'lg',
    category: 'engagement',
    roles: ['Student']
  },
  leaderboard: {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'Top student rankings',
    icon: Trophy,
    defaultSize: 'md',
    category: 'social',
    roles: ['Student', 'Teacher']
  },
  wealth_insight: {
    id: 'wealth_insight',
    title: 'Wealth Insight',
    description: 'Coin earnings vs spending',
    icon: Wallet,
    defaultSize: 'md',
    category: 'performance',
    roles: ['Student']
  },
  daily_quests: {
    id: 'daily_quests',
    title: 'Daily Quests',
    description: 'Engagement objectives',
    icon: Target,
    defaultSize: 'md',
    category: 'engagement',
    roles: ['Student']
  },
  eco_impact: {
    id: 'eco_impact',
    title: 'Eco Impact',
    description: 'Sustainability metrics',
    icon: Leaf,
    defaultSize: 'sm',
    category: 'performance',
    roles: ['Student']
  },
  study_buddy: {
    id: 'study_buddy',
    title: 'Study Buddy',
    description: 'AI-assisted study status',
    icon: Sparkles,
    defaultSize: 'md',
    category: 'engagement',
    roles: ['Student']
  },
  deadline_radar: {
    id: 'deadline_radar',
    title: 'Deadline Radar',
    description: 'Upcoming task alerts',
    icon: Clock,
    defaultSize: 'md',
    category: 'utility',
    roles: ['Student', 'Teacher']
  },
  community_pulse: {
    id: 'community_pulse',
    title: 'Community Pulse',
    description: 'Neighborhood activity',
    icon: Users,
    defaultSize: 'md',
    category: 'social',
    roles: ['Student', 'Teacher']
  },
  focus_timer: {
    id: 'focus_timer',
    title: 'Focus Timer',
    description: 'Pomodoro productivity tool',
    icon: Timer,
    defaultSize: 'sm',
    category: 'utility',
    roles: ['Student']
  },
  quick_notes: {
    id: 'quick_notes',
    title: 'Quick Notes',
    description: 'Personal sticky notes',
    icon: StickyNote,
    defaultSize: 'sm',
    category: 'utility',
    roles: ['Student', 'Teacher']
  },
  growth_chart: {
    id: 'growth_chart',
    title: 'Growth Chart',
    description: 'XP progression over time',
    icon: TrendingUp,
    defaultSize: 'md',
    category: 'performance',
    roles: ['Student', 'Teacher']
  },
  achievement_hall: {
    id: 'achievement_hall',
    title: 'Achievement Hall',
    description: 'Badge and trophy showcase',
    icon: Medal,
    defaultSize: 'md',
    category: 'engagement',
    roles: ['Student']
  },
  zen_ambiance: {
    id: 'zen_ambiance',
    title: 'Zen Ambiance',
    description: 'Focus soundscapes & lo-fi',
    icon: Music,
    defaultSize: 'sm',
    category: 'utility',
    roles: ['Student']
  }
};
