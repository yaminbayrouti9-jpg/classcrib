import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById((session.user as any).id).select('email parentEmail settings').lean();
    return NextResponse.json({ success: true, profile: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, parentEmail, privateMode } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();
    
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (parentEmail !== undefined) updateData.parentEmail = parentEmail;
    if (privateMode !== undefined) updateData.privateMode = privateMode;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return NextResponse.json({ success: true, profile: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
