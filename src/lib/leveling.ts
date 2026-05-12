/**
 * Leveling formula and utilities for ClassCrib
 */

export const getLevelFromXp = (xp: number): number => {
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3000) return 3;
  if (xp < 5000) return 4;
  if (xp < 7500) return 5;
  if (xp < 10500) return 6;
  if (xp < 14000) return 7;
  if (xp < 18000) return 8;
  if (xp < 22500) return 9;
  return 10 + Math.floor((xp - 22500) / 5000);
};

export const getXpForLevel = (level: number): number => {
  const requirements: Record<number, number> = {
    1: 0,
    2: 500,
    3: 1500,
    4: 3000,
    5: 5000,
    6: 7500,
    7: 10500,
    8: 14000,
    9: 18000,
    10: 22500,
  };
  
  if (level <= 10) return requirements[level] || 0;
  return 22500 + (level - 10) * 5000;
};

export const getNextLevelProgress = (xp: number) => {
  const currentLevel = getLevelFromXp(xp);
  const nextLevel = currentLevel + 1;
  
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(nextLevel);
  
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  
  const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    currentLevel,
    nextLevel,
    progress,
    xpRemaining: nextLevelXp - xp,
    totalXpForNext: nextLevelXp
  };
};
