import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientUsername, amount } = await req.json();

    if (!recipientUsername || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid donation details' }, { status: 400 });
    }

    await dbConnect();

    // Find donor
    const donor = await User.findById((session.user as any).id);
    if (!donor) {
      return NextResponse.json({ success: false, error: 'Donor not found' }, { status: 404 });
    }

    if (donor.coins < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient coins' }, { status: 400 });
    }

    // Find recipient
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 });
    }

    if (recipient._id.toString() === donor._id.toString()) {
      return NextResponse.json({ success: false, error: "You can't donate to yourself!" }, { status: 400 });
    }

    // Perform transaction
    const xpReward = Math.floor(amount / 10);

    // Atomic updates
    await User.findByIdAndUpdate(donor._id, { 
      $inc: { coins: -amount, xp: xpReward } 
    });
    
    await User.findByIdAndUpdate(recipient._id, { 
      $inc: { coins: amount } 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully donated ${amount} coins to ${recipientUsername}! You gained ${xpReward} XP.`,
      xpGained: xpReward
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
