import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { actionType, itemTitle, cost } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (actionType === 'upgrade') {
      const upgradeCost = (user.homeLevel || 1) * 500;
      if (user.coins < upgradeCost) {
        return NextResponse.json({ error: 'Not enough coins!' }, { status: 400 });
      }

      user.coins -= upgradeCost;
      user.homeLevel = (user.homeLevel || 1) + 1;
      user.xp += 100; // Small bonus for upgrade
      await user.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Level upgraded!', 
        newLevel: user.homeLevel,
        newCoins: user.coins 
      });
    }

    if (actionType === 'purchase') {
      if (user.coins < cost) {
        return NextResponse.json({ error: 'Not enough coins!' }, { status: 400 });
      }

      // Check if already owned
      if (user.purchasedItems?.includes(itemTitle)) {
        return NextResponse.json({ error: 'Already owned!' }, { status: 400 });
      }

      user.coins -= cost;
      if (!user.purchasedItems) user.purchasedItems = [];
      user.purchasedItems.push(itemTitle);
      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: `${itemTitle} purchased!`, 
        newCoins: user.coins 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
