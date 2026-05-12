import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Class from '@/models/Class';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, type, coins, xp, dueDate, workspaceId } = await req.json();

    if (!title || !coins || !xp || !dueDate || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.create({
      title,
      description,
      type,
      coins,
      xp,
      dueDate: new Date(dueDate),
      class: workspaceId,
      creator: (session.user as any).id,
    });

    // Notify Students in Class
    const classData = await Class.findById(workspaceId).select('students name');
    if (classData && classData.students?.length > 0) {
      const studentNotifications = classData.students.map((studentId: any) => ({
        recipient: studentId,
        sender: (session.user as any).id,
        type: 'Assignment',
        title: 'New Assignment! 📚',
        message: `Task "${title}" has been assigned to ${classData.name}.`,
        link: '/tasks'
      }));
      await Notification.insertMany(studentNotifications);
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const tasks = await Task.find({ creator: (session.user as any).id })
      .populate('class', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await dbConnect();
    const deletedTask = await Task.findOneAndDelete({ 
      _id: taskId, 
      creator: (session.user as any).id 
    });

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
