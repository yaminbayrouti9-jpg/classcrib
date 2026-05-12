import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateMixChallenge } from '@/lib/challenges';
import { getLevelFromXp } from '@/lib/leveling';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const lastLogin = new Date(user.lastLogin || user.createdAt);
    const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24));
    
    let updated = false;

    // 1. Investment Growth (Daily)
    if (diffDays > 0) {
      const growthRate = 0.02; // 2% daily growth
      const multipliers = Math.pow(1 + growthRate, Math.min(diffDays, 7)); // Cap at 7 days growth
      
      if (user.assets) {
        user.assets.gold = Math.floor((user.assets.gold || 0) * multipliers);
        user.assets.business = Math.floor((user.assets.business || 0) * multipliers);
        user.assets.property = Math.floor((user.assets.property || 0) * multipliers);
        updated = true;
      }
      user.lastLogin = now;
      updated = true;
    }

    // 3. Weekly Challenge Reset
    const lastReset = user.lastChallengeReset || user.createdAt;
    const daysSinceReset = Math.floor((now.getTime() - new Date(lastReset).getTime()) / (1000 * 3600 * 24));

    if (daysSinceReset >= 7 || !user.currentChallenge || user.currentChallenge.length === 0) {
      user.set('currentChallenge', generateMixChallenge());
      user.lastChallengeReset = now;
      updated = true;
    }

    // 4. Level Synchronization
    const correctLevel = getLevelFromXp(user.xp || 0);
    if (user.level !== correctLevel) {
      user.level = correctLevel;
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    return NextResponse.json({ 
      success: true, 
      updated, 
      challenges: user.currentChallenge,
      stats: {
        coins: user.coins,
        level: user.level,
        assets: user.assets
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
