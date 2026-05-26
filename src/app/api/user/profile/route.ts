import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById((session.user as any).id)
      .select('username role email parentEmail settings privateMode')
      .lean();
    return NextResponse.json({ success: true, profile: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { email, parentEmail, privateMode, settings, currentPassword, newPassword } = body;
    const userId = (session.user as any).id;

    await dbConnect();
    
    const user: any = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Handle password change if requested
    if (currentPassword && newPassword) {
      const userWithPass: any = await User.findById(userId).select('+password');
      if (!userWithPass || !userWithPass.password) {
        return NextResponse.json({ error: 'User password not found' }, { status: 404 });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, userWithPass.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    if (email !== undefined) user.email = email;
    if (parentEmail !== undefined) user.parentEmail = parentEmail;
    if (privateMode !== undefined) user.privateMode = privateMode;
    
    if (settings !== undefined) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    // Return sanitized profile
    const sanitizedUser = {
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      parentEmail: user.parentEmail,
      privateMode: user.privateMode,
      settings: user.settings
    };

    return NextResponse.json({ success: true, profile: sanitizedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
