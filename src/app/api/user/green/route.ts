import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { actionType, amount } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (actionType === 'daily_claim') {
      const now = new Date();
      const lastClaim = user.lastGreenClaim ? new Date(user.lastGreenClaim) : null;
      
      if (lastClaim && now.toDateString() === lastClaim.toDateString()) {
        return NextResponse.json({ error: 'Already claimed today!' }, { status: 400 });
      }

      user.greenXp += 10;
      user.lastGreenClaim = now;
      await user.save();
      return NextResponse.json({ success: true, message: 'Daily bonus claimed!', newXp: user.greenXp });
    }

    if (actionType === 'action') {
      user.greenXp += amount || 15;
      await user.save();
      return NextResponse.json({ success: true, newXp: user.greenXp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
