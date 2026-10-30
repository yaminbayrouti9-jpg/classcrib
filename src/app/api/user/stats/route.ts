import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLevelFromXp } from '@/lib/leveling';
import Class from '@/models/Class';
import Submission from '@/models/Submission';
import School from '@/models/School';
import { isStudentFeatureEnabled } from '@/lib/student-access';
import mongoose from 'mongoose';
import Transaction from '@/models/Transaction';
import IdempotencyKey from '@/models/IdempotencyKey';

// This endpoint only reads state; economic changes belong to explicit POST actions.
async function getUpdatedStats(userId: string) {
  await dbConnect();
  const user = await User.findById(userId)
    .select("_id role school schoolYear workspaces classes coins xp greenXp level homeLevel assets purchasedItems electricityStatus lastElectricityPaid waterStatus lastWaterPaid lastTaxPaid taxStatus isTaxRaidPending createdAt lastViewedLevel weeklyEarnings weeklyCap dob")
    .lean();
  if (!user) return null;

  const now = new Date();
  const createdAt = user.createdAt || new Date();
  const lastElec = new Date(user.lastElectricityPaid || createdAt);
  const lastWater = new Date(user.lastWaterPaid || createdAt);
  const lastTax = new Date(user.lastTaxPaid || createdAt);
  const msSinceElec = now.getTime() - lastElec.getTime();
  const msSinceWater = now.getTime() - lastWater.getTime();
  const msSinceTax = now.getTime() - lastTax.getTime();
  const daysSinceElec = Math.floor(msSinceElec / 86400000);
  const daysSinceWater = Math.floor(msSinceWater / 86400000);
  const daysSinceTax = Math.floor(msSinceTax / 86400000);

  let elecStatus = user.role === 'Teacher' ? 'Not Applicable' : 'Active';
  if (user.role === 'Student' && daysSinceElec >= 30) elecStatus = 'Cut';
  else if (user.role === 'Student' && daysSinceElec >= 25) elecStatus = 'Risk';

  let waterStatus = user.role === 'Teacher' ? 'Not Applicable' : 'Active';
  if (user.role === 'Student' && daysSinceWater >= 30) waterStatus = 'Cut';
  else if (user.role === 'Student' && daysSinceWater >= 25) waterStatus = 'Risk';

  let taxStatus = user.role === 'Teacher' ? 'Not Applicable' : 'Paid';
  if (user.role === 'Student' && daysSinceTax >= 7) taxStatus = 'Raid';
  const isTaxRaidPending = user.role === 'Student' && Boolean(user.isTaxRaidPending);
  const correctLevel = getLevelFromXp(user.xp || 0);

  const studentClasses = user.role === 'Student'
    ? await Class.find({ _id: { $in: user.workspaces?.length ? user.workspaces : user.classes || [] } })
        .select('students settings')
    : [];
  const school = user.school ? await School.findById(user.school).select('settings.allowLeaderboards settings.leaderboardScope') : null;
  const leaderboardEnabled = school?.settings.allowLeaderboards !== false;
  let visibleStudentIds = user.role === 'Student' && leaderboardEnabled
    ? [...new Set(studentClasses
        .filter((classDoc) => classDoc.settings?.allowLeaderboard !== false)
        .flatMap((classDoc) => classDoc.students.map((studentId) => studentId.toString())))]
    : [];
  if (user.role === 'Student' && user.school && school?.settings.leaderboardScope !== 'class') {
    const allowedClasses = await Class.find({ school: user.school, 'settings.allowLeaderboard': { $ne: false } }).select('students');
    const allowedStudentIds = [...new Set(allowedClasses.flatMap((classDoc) => classDoc.students.map((id) => id.toString())))];
    visibleStudentIds = school?.settings.leaderboardScope === 'year' && user.schoolYear
      ? (await User.find({ role: 'Student', school: user.school, schoolYear: user.schoolYear, _id: { $in: allowedStudentIds } }).distinct('_id')).map((id) => id.toString())
      : allowedStudentIds;
  }
  const visibleStudentsFilter = { role: 'Student', privateMode: { $ne: true }, _id: { $in: visibleStudentIds } };
  const globalRank = user.role === 'Student' && visibleStudentIds.includes(user._id.toString())
    ? await User.countDocuments({ ...visibleStudentsFilter, xp: { $gt: user.xp || 0 } }) + 1
    : null;
  const topStudents = user.role === 'Student'
    ? await User.find(visibleStudentsFilter).sort({ xp: -1 }).limit(5).select('username displayName xp level').lean()
    : [];
  const isFeatureEnabled = async (name: 'allowUsernameSearch' | 'allowCoinGifts' | 'allowClassChat' | 'allowTradingTerminal' | 'allowCribbyAI') =>
    user.role !== 'Student' || await isStudentFeatureEnabled(user._id.toString(), name);

  let pendingVerifications = 0;
  if (user.role === 'Teacher') {
    const classes = await Class.find({ teacher: user._id }).select('_id');
    const classIds = classes.map(c => c._id);
    pendingVerifications = await Submission.countDocuments({
      class: { $in: classIds },
      status: 'Pending'
    });
  }

  return {
    coins: user.coins || 0,
    xp: user.xp || 0,
    greenXp: user.greenXp || 0,
    homeLevel: user.homeLevel || 1,
    assets: user.assets || {},
    purchasedItems: user.purchasedItems || [],
    dob: user.dob || null,
    weeklyEarnings: user.weeklyEarnings || 0,
    weeklyCap: user.weeklyCap || 5000,
    electricityStatus: elecStatus,
    waterStatus: waterStatus,
    taxStatus: taxStatus,
    lastElectricityPaid: lastElec,
    lastWaterPaid: lastWater,
    lastTaxPaid: lastTax,
    globalRank,
    topStudents,
    level: correctLevel,
    showLevelUp: correctLevel > (user.lastViewedLevel || 1),
    showTaxRaid: isTaxRaidPending,
    dueDates: {
      electricity: user.role === 'Student' ? Math.max(0, 30 - daysSinceElec) : 0,
      water: user.role === 'Student' ? Math.max(0, 30 - daysSinceWater) : 0,
      tax: user.role === 'Student' ? Math.max(0, 7 - daysSinceTax) : 0
    },
    pendingVerifications,
    featureAccess: {
      usernameSearch: await isFeatureEnabled('allowUsernameSearch'),
      coinGifts: await isFeatureEnabled('allowCoinGifts'),
      classChat: await isFeatureEnabled('allowClassChat'),
      tradingTerminal: await isFeatureEnabled('allowTradingTerminal'),
      cribbyAI: await isFeatureEnabled('allowCribbyAI'),
      leaderboard: leaderboardEnabled && visibleStudentIds.includes(user._id.toString()),
    }
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const stats = await getUpdatedStats((session.user as { id: string }).id);
    return NextResponse.json({ success: true, stats }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('User stats request failed:', error);
    return NextResponse.json({ error: 'Unable to load account statistics.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sessionUser = session.user as { id: string; role?: string };
    const userId = sessionUser.id;
    const role = sessionUser.role;
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const { type, itemId, assetId, quantity, idempotencyKey } = body as Record<string, unknown>;
    const action = typeof (body as Record<string, unknown>).action === 'string'
      ? (body as Record<string, unknown>).action as string
      : '';
    await dbConnect();

    const studentOnlyActions = new Set([
      'ackTaxRaid',
      'buyAsset',
      'sellAsset',
      'purchase',
      'payBill',
      'payAll',
    ]);
    if (studentOnlyActions.has(action) && role !== 'Student') {
      return NextResponse.json({ error: 'This feature is only available to students' }, { status: 403 });
    }
    if (['buyAsset', 'sellAsset'].includes(action) && role === 'Student') {
      if (!(await isStudentFeatureEnabled(userId, 'allowTradingTerminal'))) {
        return NextResponse.json({ error: 'Trading Terminal is disabled by a school administrator.' }, { status: 403 });
      }
      const studentClasses = await Class.find({ students: userId }).select('settings.allowTradingTerminal');
      if (studentClasses.some((classDoc) => classDoc.settings?.allowTradingTerminal === false)) {
        return NextResponse.json({ error: 'Trading Terminal is disabled by a class administrator.' }, { status: 403 });
      }
    }

    if (action === 'completeTutorial') {
       await User.findByIdAndUpdate(userId, { $set: { hasCompletedTutorial: true } });
       return NextResponse.json({ success: true });
    }

    if (action === 'ackLevelUp') {
       const user = await User.findById(userId).select('xp');
       if (user) await User.updateOne({ _id: userId }, { $set: { lastViewedLevel: getLevelFromXp(user.xp || 0) } });
       return NextResponse.json({ success: true });
    }

    if (action === 'ackTaxRaid') {
      await User.findByIdAndUpdate(userId, { 
        $set: { 
          isTaxRaidPending: false, 
          lastTaxPaid: new Date(), 
          taxStatus: 'Paid' 
        } 
      });
      return NextResponse.json({ success: true, stats: await getUpdatedStats(userId) });
    }

    const financialActions = new Set(['buyAsset', 'sellAsset', 'purchase', 'payBill', 'payAll']);
    if (!financialActions.has(String(action))) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'A valid request key is required. Please retry.' }, { status: 400 });
    }

    let marketPrice: number | undefined;
    if (action === 'buyAsset' || action === 'sellAsset') {
      const assetIds = ['gold', 'silver', 'cnc500', 'business', 'property'] as const;
      if (typeof assetId !== 'string' || !assetIds.includes(assetId as typeof assetIds[number]) ||
          !Number.isSafeInteger(quantity) || Number(quantity) <= 0 || Number(quantity) > 1000) {
        return NextResponse.json({ error: 'Invalid asset or quantity.' }, { status: 400 });
      }
      const marketResponse = await fetch(new URL('/api/market/prices', req.url), { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!marketResponse.ok) return NextResponse.json({ error: 'Authoritative market prices are unavailable.' }, { status: 503 });
      const market = await marketResponse.json();
      const rawPrice = market.prices?.[assetId as typeof assetIds[number]];
      if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
        return NextResponse.json({ error: 'Invalid authoritative market price.' }, { status: 503 });
      }
      marketPrice = rawPrice;
    }

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        await IdempotencyKey.create([{ key: idempotencyKey, actor: userId, operation: `stats-${action}` }], { session: mongoSession });

        if (action === 'buyAsset' || action === 'sellAsset') {
          const asset = assetId as 'gold' | 'silver' | 'cnc500' | 'business' | 'property';
          const quantityValue = Number(quantity);
          const unitPrice = asset === 'business' ? (marketPrice as number) / 100 : marketPrice as number;
          const total = Math.round(unitPrice * quantityValue * 100) / 100;
          const assetPath = `assets.${asset}`;
          const buying = action === 'buyAsset';
          const updated = await User.findOneAndUpdate(
            buying
              ? { _id: userId, role: 'Student', coins: { $gte: total } }
              : { _id: userId, role: 'Student', [assetPath]: { $gte: quantityValue } },
            buying
              ? { $inc: { coins: -total, [assetPath]: quantityValue } }
              : { $inc: { coins: total, [assetPath]: -quantityValue } },
            { new: true, session: mongoSession },
          );
          if (!updated) throw new Error(buying ? 'INSUFFICIENT_COINS' : 'INSUFFICIENT_ASSETS');
          await Transaction.create([{
            user: userId,
            amount: buying ? -total : total,
            type: 'Investment',
            category: asset === 'gold' || asset === 'silver' || asset === 'cnc500' ? (asset === 'gold' ? 'Gold' : 'Business') : asset === 'business' ? 'Business' : 'Property',
            description: `${buying ? 'Bought' : 'Sold'} ${quantityValue} ${asset}`,
            reason: 'Virtual trading simulation',
          }], { session: mongoSession });
          return;
        }

        if (action === 'purchase') {
          const itemPrices: Record<string, number> = {
            ai_turbo: 500, zen_ambiance: 450, focus_timer: 800, pdf_export: 1200,
            solar_panels: 5000, wind_turbine: 7500, business_seed: 5000,
            real_estate: 15000, smart_meter: 1500,
          };
          if (typeof itemId !== 'string' || !Object.hasOwn(itemPrices, itemId)) throw new Error('INVALID_ITEM');
          const price = itemPrices[itemId];
          const recurringAsset = itemId === 'business_seed' || itemId === 'real_estate';
          const assetName = itemId === 'business_seed' ? 'business' : 'property';
          const updated = await User.findOneAndUpdate(
            {
              _id: userId,
              role: 'Student',
              coins: { $gte: price },
              ...(recurringAsset ? {} : { purchasedItems: { $ne: itemId } }),
            },
            {
              $inc: { coins: -price, ...(recurringAsset ? { [`assets.${assetName}`]: price } : {}) },
              ...(recurringAsset ? {} : { $addToSet: { purchasedItems: itemId } }),
            },
            { new: true, session: mongoSession },
          );
          if (!updated) throw new Error('PURCHASE_CONFLICT');
          await Transaction.create([{
            user: userId,
            amount: -price,
            type: 'Expense',
            category: 'Want',
            description: `Purchased ${itemId}`,
            reason: 'Virtual store purchase',
          }], { session: mongoSession });
          return;
        }

        if (action === 'payBill' || action === 'payAll') {
          const user = await User.findOne({ _id: userId, role: 'Student' }).session(mongoSession);
          if (!user) throw new Error('USER_NOT_FOUND');
          const purchasedItems = user.purchasedItems || [];
          const baseCosts = { electricity: 200, water: 150, tax: 300 };
          const lastPayments = {
            electricity: new Date(user.lastElectricityPaid || user.createdAt),
            water: new Date(user.lastWaterPaid || user.createdAt),
            tax: new Date(user.lastTaxPaid || user.createdAt),
          };
          const statuses = {
            electricity: user.electricityStatus,
            water: user.waterStatus,
            tax: user.taxStatus,
          };
          const dueThresholds = { electricity: 23, water: 23, tax: 5 };
          const isDue = (bill: keyof typeof baseCosts) =>
            statuses[bill] !== (bill === 'tax' ? 'Paid' : 'Active') ||
            Math.floor((Date.now() - lastPayments[bill].getTime()) / 86400000) >= dueThresholds[bill];
          const bills: Array<keyof typeof baseCosts> = action === 'payBill'
            ? (['electricity', 'water', 'tax'].includes(String(type)) ? [type as keyof typeof baseCosts] : [])
            : (['electricity', 'water', 'tax'] as const).filter(isDue);
          if (!bills.length) {
            if (action === 'payBill' && !['electricity', 'water', 'tax'].includes(String(type))) throw new Error('INVALID_BILL');
            throw new Error('BILL_NOT_DUE');
          }
          if (bills.some((bill) => !isDue(bill))) throw new Error('BILL_NOT_DUE');
          const discount = (bill: keyof typeof baseCosts) => {
            if (bill === 'electricity') {
              if (purchasedItems.includes('Tesla Powerwall')) return 0.2;
              if (purchasedItems.includes('Solar Battery')) return 0.5;
              if (purchasedItems.includes('wind_turbine')) return 0.6;
              if (purchasedItems.includes('solar_panels') || purchasedItems.includes('Solar Array')) return 0.7;
            }
            if (bill === 'water') {
              if (purchasedItems.includes('Off-Grid Purifier')) return 0.2;
              if (purchasedItems.includes('Water Reservoir')) return 0.5;
            }
            if (bill === 'tax' && purchasedItems.includes('Tax Consultant')) return 0.8;
            return 1;
          };
          const billCosts = bills.map((bill) => Math.floor(baseCosts[bill] * discount(bill)));
          const total = billCosts.reduce((sum, cost) => sum + cost, 0);
          const paidAt = new Date();
          const setFields: Record<string, unknown> = {};
          bills.forEach((bill) => {
            setFields[bill === 'electricity' ? 'electricityStatus' : bill === 'water' ? 'waterStatus' : 'taxStatus'] = bill === 'tax' ? 'Paid' : 'Active';
            setFields[bill === 'electricity' ? 'lastElectricityPaid' : bill === 'water' ? 'lastWaterPaid' : 'lastTaxPaid'] = paidAt;
            if (bill === 'tax') setFields.isTaxRaidPending = false;
          });
          const updated = await User.updateOne({ _id: userId, role: 'Student', coins: { $gte: total } }, {
            $inc: { coins: -total },
            $set: setFields,
          }, { session: mongoSession });
          if (!updated.modifiedCount) throw new Error('INSUFFICIENT_COINS');
          await Transaction.create(bills.map((bill, index) => ({
            user: userId,
            amount: -billCosts[index],
            type: 'Expense',
            category: 'Need',
            description: `Paid ${bill} bill`,
            reason: 'Virtual home bill payment',
          })), { session: mongoSession });
          return;
        }
      });
    } finally {
      await mongoSession.endSession();
    }
    return NextResponse.json({ success: true, stats: await getUpdatedStats(userId) });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: 'This request has already been processed.' }, { status: 409 });
    if (error instanceof Error && error.message === 'INVALID_ITEM') return NextResponse.json({ error: 'Invalid item.' }, { status: 400 });
    if (error instanceof Error && error.message === 'INVALID_BILL') return NextResponse.json({ error: 'Invalid bill type.' }, { status: 400 });
    if (error instanceof Error && error.message === 'BILL_NOT_DUE') return NextResponse.json({ error: 'This bill is not due yet.' }, { status: 409 });
    if (error instanceof Error && error.message === 'PURCHASE_CONFLICT') return NextResponse.json({ error: 'Insufficient coins or item already owned.' }, { status: 409 });
    if (error instanceof Error && error.message === 'INSUFFICIENT_COINS') return NextResponse.json({ error: 'Insufficient coins.' }, { status: 400 });
    if (error instanceof Error && error.message === 'INSUFFICIENT_ASSETS') return NextResponse.json({ error: 'Insufficient assets.' }, { status: 400 });
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    console.error('Virtual economy request failed:', error);
    return NextResponse.json({ error: 'Request failed; no partial balance changes were committed.' }, { status: 500 });
  }
}
