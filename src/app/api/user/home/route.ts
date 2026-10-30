import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import IdempotencyKey from '@/models/IdempotencyKey';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as { role?: string }).role !== 'Student') {
      return NextResponse.json({ error: 'Virtual home is only available to students' }, { status: 403 });
    }

    const { actionType, itemTitle, idempotencyKey } = await req.json();
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'A valid request key is required. Please retry.' }, { status: 400 });
    }
    const userId = (session.user as { id: string }).id;

    await dbConnect();
    const mongoSession = await mongoose.startSession();
    try {
      let response: Record<string, unknown> = {};
      await mongoSession.withTransaction(async () => {
    await IdempotencyKey.create([{ key: idempotencyKey, actor: userId, operation: `virtual-home-${actionType}` }], { session: mongoSession });
    if (actionType === 'upgrade') {
      const current = await User.findById(userId).select('homeLevel').session(mongoSession);
      if (!current) throw new Error('USER_NOT_FOUND');
      const currentLevel = current.homeLevel || 1;
      const upgradeCost = currentLevel * 500;
      const upgraded = await User.findOneAndUpdate(
        { _id: userId, homeLevel: currentLevel, coins: { $gte: upgradeCost } },
        { $inc: { coins: -upgradeCost, homeLevel: 1 } },
        { new: true, session: mongoSession }
      );
      if (!upgraded) throw new Error('UPGRADE_CONFLICT');
      await Transaction.create([{
        user: userId,
        amount: -upgradeCost,
        type: 'Expense',
        category: 'Want',
        description: `Virtual home upgrade to level ${upgraded.homeLevel}`,
        reason: 'Virtual home upgrade',
      }], { session: mongoSession });
      response = { success: true, message: 'Level upgraded!', newLevel: upgraded.homeLevel, newCoins: upgraded.coins };
      return;
    }

    if (actionType === 'purchase') {
      const products: Record<string, { cost: number; level: number }> = {
        'Backyard Garden': { cost: 500, level: 1 },
        'Solar Array': { cost: 1200, level: 1 },
        'Solar Battery': { cost: 2000, level: 5 },
        'Water Reservoir': { cost: 1800, level: 8 },
        'Tax Consultant': { cost: 3500, level: 12 },
        'Sports Zone': { cost: 2500, level: 15 },
        'Gaming Setup': { cost: 4000, level: 20 },
        'Art Studio': { cost: 1800, level: 25 },
        'Tesla Powerwall': { cost: 5000, level: 35 },
        'Off-Grid Purifier': { cost: 4500, level: 45 },
        'Golden Statue': { cost: 10000, level: 50 },
      };
      const product = typeof itemTitle === 'string' ? products[itemTitle] : undefined;
      if (!product) throw new Error('INVALID_PRODUCT');
      const user = await User.findById(userId).select('level').session(mongoSession);
      if (!user) throw new Error('USER_NOT_FOUND');
      if (user.level < product.level) throw new Error('LEVEL_REQUIRED');

      const purchased = await User.findOneAndUpdate(
        { _id: userId, coins: { $gte: product.cost }, purchasedItems: { $ne: itemTitle } },
        { $inc: { coins: -product.cost }, $addToSet: { purchasedItems: itemTitle } },
        { new: true, session: mongoSession }
      );
      if (!purchased) throw new Error('PURCHASE_CONFLICT');
      await Transaction.create([{
        user: userId,
        amount: -product.cost,
        type: 'Expense',
        category: 'Want',
        description: `Purchased ${itemTitle}`,
        reason: 'Virtual home item purchase',
      }], { session: mongoSession });
      response = { success: true, message: `${itemTitle} purchased!`, newCoins: purchased.coins };
      return;
    }

    throw new Error('INVALID_ACTION');
      });
      return NextResponse.json(response);
    } finally {
      await mongoSession.endSession();
    }

  } catch (error) {
    if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: 'This request has already been processed.' }, { status: 409 });
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (error instanceof Error && error.message === 'INVALID_PRODUCT') return NextResponse.json({ error: 'Invalid home product.' }, { status: 400 });
    if (error instanceof Error && error.message === 'LEVEL_REQUIRED') return NextResponse.json({ error: 'Reach the required level to unlock this item.' }, { status: 403 });
    if (error instanceof Error && ['UPGRADE_CONFLICT', 'PURCHASE_CONFLICT'].includes(error.message)) return NextResponse.json({ error: 'Not enough coins, or this update has already occurred.' }, { status: 409 });
    if (error instanceof Error && error.message === 'INVALID_ACTION') return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    console.error('Virtual home operation failed:', error);
    return NextResponse.json({ error: 'Virtual home operation failed; no partial changes were committed.' }, { status: 500 });
  }
}
