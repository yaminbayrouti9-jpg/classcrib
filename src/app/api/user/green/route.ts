import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionType, activityId } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();

    if (actionType === 'daily_claim') {
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);
      const updated = await User.findOneAndUpdate(
        {
          _id: userId,
          $or: [{ lastGreenClaim: null }, { lastGreenClaim: { $lt: new Date(`${dateKey}T00:00:00.000Z`) } }],
        },
        { $inc: { greenXp: 10 }, $set: { lastGreenClaim: now } },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Already claimed today, or account not found.' }, { status: 409 });
      }
      return NextResponse.json({ success: true, message: 'Daily bonus claimed!', newXp: updated.greenXp });
    }

    if (actionType === 'action') {
      const activityRewards: Record<string, number> = {
        save_water: 15,
        solar_power: 25,
        plant_trees: 50,
      };
      const amount = activityRewards[activityId];
      if (!amount) return NextResponse.json({ error: 'Invalid eco activity.' }, { status: 400 });
      const dateKey = new Date().toISOString().slice(0, 10);
      const updated = await User.findOneAndUpdate(
        {
          _id: userId,
          greenClaims: { $not: { $elemMatch: { actionId: activityId, dateKey } } },
        },
        {
          $inc: { greenXp: amount },
          $push: { greenClaims: { actionId: activityId, dateKey, claimedAt: new Date() } },
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'This eco activity has already been claimed today, or account not found.' }, { status: 409 });
      }
      return NextResponse.json({ success: true, newXp: updated.greenXp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
