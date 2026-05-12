import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const workspaces = await Class.find({ teacher: (session.user as any).id })
      .populate('students', 'username')
      .lean();

    return NextResponse.json({ success: true, workspaces });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    await dbConnect();

    // Generate a unique invite code
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();

    const workspace = await Class.create({
      name,
      teacher: (session.user as any).id,
      inviteCode,
      students: [],
      posts: []
    });

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
