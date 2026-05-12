import { 
  Zap, 
  Leaf, 
  Heart, 
  Palette, 
  Clock, 
  MessageSquare, 
  Brain, 
  Calendar,
  Trophy,
  Star,
  Target,
  Rocket
} from "lucide-react";

export const PREDEFINED_BADGES = [
  { 
    id: "academic_eagle",
    label: "Academic Eagle", 
    description: "High performance in assignments",
    icon: "Zap", 
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  },
  { 
    id: "eco_warrior",
    label: "Eco Warrior", 
    description: "Great environmental consciousness",
    icon: "Leaf", 
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20"
  },
  { 
    id: "community_hero",
    label: "Community Hero", 
    description: "Helping fellow students",
    icon: "Heart", 
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20"
  },
  { 
    id: "creative_genius",
    label: "Creative Genius", 
    description: "Outstanding creativity",
    icon: "Palette", 
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20"
  },
  { 
    id: "early_bird",
    label: "Early Bird", 
    description: "Early submission of tasks",
    icon: "Clock", 
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20"
  },
  { 
    id: "star_participant",
    label: "Star Participant", 
    description: "Excellent class participation",
    icon: "MessageSquare", 
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20"
  },
  { 
    id: "problem_solver",
    label: "Problem Solver", 
    description: "Solving complex challenges",
    icon: "Brain", 
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  { 
    id: "perfect_attendance",
    label: "Perfect Attendance", 
    description: "Always present and active",
    icon: "Calendar", 
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  { 
    id: "top_contributor",
    label: "Top Contributor", 
    description: "Significantly helped the class community",
    icon: "Trophy", 
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  { 
    id: "rising_star",
    label: "Rising Star", 
    description: "Rapidly improving performance",
    icon: "Rocket", 
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  }
];

export const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Zap, Leaf, Heart, Palette, Clock, MessageSquare, Brain, Calendar, Trophy, Star, Target, Rocket
  };
  return icons[iconName] || Star;
};
