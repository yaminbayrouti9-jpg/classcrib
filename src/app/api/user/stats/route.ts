import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLevelFromXp } from '@/lib/leveling';
import Class from '@/models/Class';
import Submission from '@/models/Submission';
import Workspace from '@/models/Workspace';

// Helper to handle all user state updates in one go
async function getUpdatedStats(userId: string) {
  await dbConnect();
  
  // Use non-lean to have access to .save()
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const createdAt = user.createdAt || new Date();

  // 1. TIMESTAMPS (With fallback for legacy nested 'needs' object)
  const lastElec = user.lastElectricityPaid || user.get('needs.lastElectricityPaid') ? new Date(user.lastElectricityPaid || user.get('needs.lastElectricityPaid')) : new Date(createdAt);
  const lastWater = user.lastWaterPaid || user.get('needs.lastWaterPaid') ? new Date(user.lastWaterPaid || user.get('needs.lastWaterPaid')) : new Date(createdAt);
  const lastTax = user.lastTaxPaid || user.get('needs.lastTaxPaid') ? new Date(user.lastTaxPaid || user.get('needs.lastTaxPaid')) : new Date(createdAt);
  const lastFine = user.lastFinedAt || user.get('needs.lastFinedAt') ? new Date(user.lastFinedAt || user.get('needs.lastFinedAt')) : null;

  // 2. MATH
  const msSinceElec = now.getTime() - lastElec.getTime();
  const msSinceWater = now.getTime() - lastWater.getTime();
  const msSinceTax = now.getTime() - lastTax.getTime();
  const msSinceFine = lastFine ? (now.getTime() - lastFine.getTime()) : (86400000 * 365);

  const daysSinceElec = Math.floor(msSinceElec / 86400000);
  const daysSinceWater = Math.floor(msSinceWater / 86400000);
  const daysSinceTax = Math.floor(msSinceTax / 86400000);

  // 3. STATUS DERIVATION
  let elecStatus = 'Active';
  if (daysSinceElec >= 30) elecStatus = 'Cut';
  else if (daysSinceElec >= 25) elecStatus = 'Risk';

  let waterStatus = 'Active';
  if (daysSinceWater >= 30) waterStatus = 'Cut';
  else if (daysSinceWater >= 25) waterStatus = 'Risk';

  let taxStatus = 'Paid';
  if (daysSinceTax >= 7) taxStatus = 'Raid';

  let isTaxRaidPending = user.isTaxRaidPending || user.get('needs.isTaxRaidPending') || false;

  // 4. ATOMIC FINE PROTECTION (HARD STOP)
  let dbUpdated = false;

  // If tax is overdue AND it's been at least 23.5 hours since last fine
  if (daysSinceTax >= 7 && msSinceFine >= (23.5 * 3600 * 1000) && taxStatus !== 'Paid') {
     user.coins = (user.coins || 0) - 1000;
     user.lastFinedAt = now;
     user.taxStatus = 'Raid';
     user.isTaxRaidPending = true;
     taxStatus = 'Raid';
     isTaxRaidPending = true;
     dbUpdated = true;
  }

  // Sync other statuses
  if (user.electricityStatus !== elecStatus) {
    user.electricityStatus = elecStatus;
    dbUpdated = true;
  }
  if (user.waterStatus !== waterStatus) {
    user.waterStatus = waterStatus;
    dbUpdated = true;
  }
  if (user.taxStatus !== taxStatus) {
    user.taxStatus = taxStatus;
    dbUpdated = true;
  }
  if (user.isTaxRaidPending !== isTaxRaidPending) {
    user.isTaxRaidPending = isTaxRaidPending;
    dbUpdated = true;
  }

  // 5. Level Synchronization & Rewards
  const correctLevel = getLevelFromXp(user.xp || 0);
  if (user.level !== correctLevel) {
    const oldLevel = user.level || 1;
    user.level = correctLevel;
    dbUpdated = true;

    // Award level-up bonuses
    if (correctLevel > oldLevel) {
      // Award Coins (500 per level)
      user.coins = (user.coins || 0) + (correctLevel - oldLevel) * 500;

      // Special Unlocks
      if (correctLevel >= 3 && !user.purchasedItems.includes('Cottage Base')) {
        user.purchasedItems.push('Cottage Base');
      }
      if (correctLevel >= 5 && !user.purchasedItems.includes('Modern Villa')) {
        user.purchasedItems.push('Modern Villa');
      }
      if (correctLevel >= 10 && !user.purchasedItems.includes('Mansion Style')) {
        user.purchasedItems.push('Mansion Style');
      }
    }
  }

  // 6. Weekly Earnings Reset
  const lastReset = user.lastWeeklyReset ? new Date(user.lastWeeklyReset) : new Date(createdAt);
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / 86400000);
  if (daysSinceReset >= 7) {
    user.weeklyEarnings = 0;
    user.lastWeeklyReset = now;
    dbUpdated = true;
  }

  if (dbUpdated) {
    await user.save();
  }

  const globalRank = await User.countDocuments({ role: 'Student', xp: { $gt: user.xp || 0 } }) + 1;
  const topStudents = await User.find({ role: 'Student' })
    .sort({ xp: -1 })
    .limit(5)
    .select('username xp level')
    .lean();

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
    ...user.toObject(),
    electricityStatus: elecStatus,
    waterStatus: waterStatus,
    taxStatus: taxStatus,
    lastElectricityPaid: lastElec,
    lastWaterPaid: lastWater,
    lastTaxPaid: lastTax,
    globalRank,
    topStudents,
    showLevelUp: (user.level || 1) > (user.lastViewedLevel || 1),
    showTaxRaid: isTaxRaidPending,
    dueDates: {
      electricity: Math.max(0, 30 - daysSinceElec),
      water: Math.max(0, 30 - daysSinceWater),
      tax: Math.max(0, 7 - daysSinceTax)
    },
    pendingVerifications
  };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const stats = await getUpdatedStats((session.user as any).id);
    return NextResponse.json({ success: true, stats }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const body = await req.json();
    const { action, type, itemId, assetId, quantity, pricePerUnit } = body;
    await dbConnect();

    if (action === 'completeTutorial') {
       await User.findByIdAndUpdate(userId, { $set: { hasCompletedTutorial: true } });
       return NextResponse.json({ success: true });
    }

    if (action === 'ackLevelUp') {
       const user = await User.findById(userId);
       if (user) {
         user.lastViewedLevel = user.level || 1;
         await user.save();
       }
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

    if (action === 'buyAsset' || action === 'sellAsset') {
      const user = await User.findById(userId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const totalCost = quantity * pricePerUnit;
      
      if (!user.assets) user.assets = { gold: 0, silver: 0, cnc500: 0, business: 0, property: 0 };

      if (action === 'buyAsset') {
        if (user.coins < totalCost) return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
        user.coins -= totalCost;
        (user.assets as any)[assetId] = ((user.assets as any)[assetId] || 0) + quantity;
      } else {
        if (((user.assets as any)[assetId] || 0) < quantity) return NextResponse.json({ error: 'Insufficient assets' }, { status: 400 });
        user.coins += totalCost;
        (user.assets as any)[assetId] = ((user.assets as any)[assetId] || 0) - quantity;
      }

      await user.save();
      return NextResponse.json({ success: true, stats: await getUpdatedStats(userId) });
    }

    if (action === 'purchase') {
      const user = await User.findById(userId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const itemPrices: any = {
        ai_turbo: 500,
        zen_ambiance: 450,
        focus_timer: 800,
        pdf_export: 1200,
        solar_panels: 5000,
        wind_turbine: 7500,
        business_seed: 5000,
        real_estate: 15000,
        smart_meter: 1500,
      };

      const price = itemPrices[itemId];
      if (!price) return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
      if (user.coins < price) return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });

      user.coins -= price;
      
      if (itemId === 'business_seed' || itemId === 'real_estate') {
        if (!user.assets) user.assets = { gold: 0, silver: 0, cnc500: 0, business: 0, property: 0 };
        if (itemId === 'business_seed') user.assets.business = (user.assets.business || 0) + price;
        if (itemId === 'real_estate') user.assets.property = (user.assets.property || 0) + price;
      } else {
        if (!user.purchasedItems.includes(itemId)) {
          user.purchasedItems.push(itemId);
        }
      }

      await user.save();
      return NextResponse.json({ success: true, stats: await getUpdatedStats(userId) });
    }

    if (action === 'payBill' || action === 'payAll') {
      const user = await User.findById(userId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const purchasedItems = user.purchasedItems || [];
      const costs = { electricity: 200, water: 150, tax: 300 };
      
      const getDiscount = (billType: string) => {
        if (billType === 'electricity') {
          if (purchasedItems.includes('Tesla Powerwall')) return 0.2;
          if (purchasedItems.includes('Solar Battery')) return 0.5;
          if (purchasedItems.includes('wind_turbine')) return 0.6;
          if (purchasedItems.includes('solar_panels') || purchasedItems.includes('Solar Array')) return 0.7; // 30% reduction
          return 1;
        }
        if (billType === 'water') {
          if (purchasedItems.includes('Off-Grid Purifier')) return 0.2;
          if (purchasedItems.includes('Water Reservoir')) return 0.5;
          return 1;
        }
        if (billType === 'tax') {
          if (purchasedItems.includes('Tax Consultant')) return 0.8;
          return 1;
        }
        return 1;
      };

      const processPayment = (billType: string) => {
        const cost = Math.floor((costs as any)[billType] * getDiscount(billType));
        user.coins -= cost;
        if (billType === 'electricity') {
          user.electricityStatus = 'Active';
          user.lastElectricityPaid = new Date();
        } else if (billType === 'water') {
          user.waterStatus = 'Active';
          user.lastWaterPaid = new Date();
        } else if (billType === 'tax') {
          user.taxStatus = 'Paid';
          user.lastTaxPaid = new Date();
          user.isTaxRaidPending = false;
        }
      };

      if (action === 'payBill') {
        processPayment(type);
      } else {
        const now = new Date();
        const lastElec = new Date(user.lastElectricityPaid || user.get('needs.lastElectricityPaid') || user.createdAt);
        const lastWater = new Date(user.lastWaterPaid || user.get('needs.lastWaterPaid') || user.createdAt);
        const lastTax = new Date(user.lastTaxPaid || user.get('needs.lastTaxPaid') || user.createdAt);
        
        const dE = Math.floor((now.getTime() - lastElec.getTime()) / 86400000);
        const dW = Math.floor((now.getTime() - lastWater.getTime()) / 86400000);
        const dT = Math.floor((now.getTime() - lastTax.getTime()) / 86400000);

        if ((user.electricityStatus || user.get('needs.electricityStatus')) !== 'Active' || dE >= 23) processPayment('electricity');
        if ((user.waterStatus || user.get('needs.waterStatus')) !== 'Active' || dW >= 23) processPayment('water');
        if ((user.taxStatus || user.get('needs.taxStatus')) !== 'Paid' || dT >= 5) processPayment('tax');
      }

      await user.save();
      return NextResponse.json({ success: true, stats: await getUpdatedStats(userId) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
