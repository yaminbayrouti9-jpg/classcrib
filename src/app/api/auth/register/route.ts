import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { username, password, role, dob } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    await dbConnect();

    const userExists = await User.findOne({ username });
    if (userExists) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      dob: dob ? new Date(dob) : undefined,
      coins: role === 'Student' ? 1000 : 0,
      xp: 0,
    });

    return NextResponse.json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
