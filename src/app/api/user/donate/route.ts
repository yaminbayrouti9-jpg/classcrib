import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import IdempotencyKey from '@/models/IdempotencyKey';
import { authOptions } from '@/lib/auth';
import Class from '@/models/Class';
import School from '@/models/School';
import { isStudentFeatureEnabled } from '@/lib/student-access';

const PER_GIFT_LIMIT = 500;
const DAILY_GIFT_LIMIT = 1000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor || actor.role !== 'Student' || !actor.id) {
    return NextResponse.json({ success: false, error: 'Only students can gift coins.' }, { status: 403 });
  }

  let dailyGiftLimit = DAILY_GIFT_LIMIT;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid gift request.' }, { status: 400 });
    }
    const { recipientUsername, amount, idempotencyKey } = body as Record<string, unknown>;
    const donorId = actor.id;
    if (typeof recipientUsername !== 'string' || recipientUsername.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Enter a valid recipient username.' }, { status: 400 });
    }
    if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0 || amount > PER_GIFT_LIMIT) {
      return NextResponse.json({ success: false, error: `Gift amount must be from 1 to ${PER_GIFT_LIMIT} coins.` }, { status: 400 });
    }
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json({ success: false, error: 'A valid request key is required. Please retry.' }, { status: 400 });
    }

    await dbConnect();
    if (!(await isStudentFeatureEnabled(donorId, "allowCoinGifts")) ||
        !(await isStudentFeatureEnabled(donorId, "allowUsernameSearch"))) {
      return NextResponse.json({ success: false, error: 'Coin gifting or username search is disabled by your school.' }, { status: 403 });
    }
    const donorAccount = await User.findById(donorId).select("school");
    const school = donorAccount?.school ? await School.findById(donorAccount.school).select("settings.coinGiftPerTransferCap settings.coinGiftPerDayCap") : null;
    const perGiftLimit = school?.settings.coinGiftPerTransferCap ?? PER_GIFT_LIMIT;
    dailyGiftLimit = school?.settings.coinGiftPerDayCap ?? DAILY_GIFT_LIMIT;
    if (amount > perGiftLimit) {
      return NextResponse.json({ success: false, error: `Gift amount must be from 1 to ${perGiftLimit} coins.` }, { status: 400 });
    }
    const giftingClasses = await Class.find({
      students: donorId,
      ...(donorAccount?.school ? { school: donorAccount.school } : { school: { $exists: false } }),
      'settings.allowCoinGifts': { $ne: false },
      'settings.allowUsernameSearch': { $ne: false },
    }).select('students');
    const eligibleStudentIds = [...new Set(giftingClasses.flatMap((classDoc) =>
      classDoc.students.map((studentId) => studentId.toString())
    ))].filter((studentId) => studentId !== donorId);
    if (!eligibleStudentIds.length) {
      return NextResponse.json({ success: false, error: 'You can only find and gift coins to a classmate when both features are enabled for your class.' }, { status: 403 });
    }
    const recipient = await User.findOne({
      username: recipientUsername.trim().toLowerCase(),
      role: 'Student',
      _id: { $in: eligibleStudentIds },
    }).select('_id username');
    if (!recipient) return NextResponse.json({ success: false, error: 'Student recipient not found in an eligible class.' }, { status: 404 });

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        await IdempotencyKey.create([{
          key: idempotencyKey,
          actor: donorId,
          operation: 'coin-gift',
        }], { session: mongoSession });

        const donor = await User.findById(donorId).session(mongoSession);
        if (!donor) throw new Error('DONOR_NOT_FOUND');
        const dateKey = new Date().toISOString().slice(0, 10);
        if (donor.giftsDateKey !== dateKey) {
          donor.giftsDateKey = dateKey;
          donor.giftsSentToday = 0;
        }
        if ((donor.giftsSentToday || 0) + amount > dailyGiftLimit) {
          throw new Error('DAILY_LIMIT');
        }
        if ((donor.coins || 0) < amount) throw new Error('INSUFFICIENT_COINS');

        donor.coins -= amount;
        donor.giftsSentToday = (donor.giftsSentToday || 0) + amount;
        await donor.save({ session: mongoSession });

        await User.updateOne({ _id: recipient._id }, { $inc: { coins: amount } }, { session: mongoSession });
        await Transaction.create([
          {
            user: donor._id,
            amount: -amount,
            type: 'Expense',
            category: 'Reward',
            description: `Gift sent to @${recipient.username}`,
            recipient: recipient._id,
            reason: 'Student coin gift',
          },
          {
            user: recipient._id,
            amount,
            type: 'Income',
            category: 'Reward',
            description: `Gift received from @${donor.username}`,
            awardedBy: donor._id,
            reason: 'Student coin gift',
          },
        ], { session: mongoSession });
      });
    } finally {
      await mongoSession.endSession();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully gifted ${amount} coins to ${recipientUsername}.`,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ success: false, error: 'This gift request has already been processed.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'DAILY_LIMIT') {
      return NextResponse.json({ success: false, error: `Daily gift limit is ${dailyGiftLimit} coins.` }, { status: 429 });
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_COINS') {
      return NextResponse.json({ success: false, error: 'Insufficient coins.' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'DONOR_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Student account not found.' }, { status: 404 });
    }
    console.error('Coin gift transaction failed:', error);
    return NextResponse.json({ success: false, error: 'Gift failed. No balances were changed.' }, { status: 500 });
  }
}
