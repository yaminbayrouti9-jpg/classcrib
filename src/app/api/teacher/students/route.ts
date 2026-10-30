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

    const { username, password, displayName, workspaceId } = await req.json();

    if (!username || !password || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
        typeof password !== "string" || password.length < 10 || password.length > 128 ||
        (displayName !== undefined && (typeof displayName !== "string" || displayName.trim().length > 100))) {
      return NextResponse.json({ error: "Username, password, or display name is invalid." }, { status: 400 });
    }
    const targetClass = await Class.findOne({ _id: workspaceId, teacher: (session.user as any).id }).select("_id school yearGroup");
    if (!targetClass) return NextResponse.json({ error: "Class not found or you do not teach it." }, { status: 403 });
    const normalizedUsername = username.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const student = await User.create({
      username: normalizedUsername,
      displayName: typeof displayName === 'string' ? displayName.trim().slice(0, 100) : undefined,
      password: hashedPassword,
      role: 'Student',
      workspaces: [workspaceId],
      classes: [workspaceId],
      school: targetClass.school,
      schoolYear: targetClass.yearGroup,
    });

    // Add student to class
    await Class.updateOne({ _id: workspaceId, teacher: (session.user as any).id }, {
      $addToSet: { students: student._id },
    });

    return NextResponse.json({ 
      success: true, 
      student: { id: student._id, username: student.username, displayName: student.displayName }
    });

  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
