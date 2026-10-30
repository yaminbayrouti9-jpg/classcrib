import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { username, displayName, password, role, dob } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }
    if (role !== 'Student') {
      return NextResponse.json({ message: 'Teacher accounts must be created by an authorized school administrator.' }, { status: 403 });
    }
    if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 32) {
      return NextResponse.json({ message: 'Username must be between 3 and 32 characters.' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      return NextResponse.json({ message: 'Password must be between 10 and 128 characters.' }, { status: 400 });
    }
    if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 100) {
      return NextResponse.json({ message: 'A display name of 2 to 100 characters is required.' }, { status: 400 });
    }
    if (dob && (Number.isNaN(Date.parse(dob)) || new Date(dob) > new Date())) {
      return NextResponse.json({ message: 'Date of birth is invalid.' }, { status: 400 });
    }

    await dbConnect();

    const normalizedUsername = username.trim().toLowerCase();
    const userExists = await User.findOne({ username: normalizedUsername });
    if (userExists) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      displayName: displayName.trim(),
      password: hashedPassword,
      role: 'Student',
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
