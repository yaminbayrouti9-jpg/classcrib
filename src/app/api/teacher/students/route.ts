import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Class from '@/models/Class';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, password, workspaceId } = await req.json();

    if (!username || !password || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const student = await User.create({
      username,
      password: hashedPassword,
      role: 'Student',
      workspaces: [workspaceId],
    });

    // Add student to class
    await Class.findByIdAndUpdate(workspaceId, {
      $addToSet: { students: student._id },
    });

    return NextResponse.json({ 
      success: true, 
      student: { id: student._id, username: student.username } 
    });

  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
