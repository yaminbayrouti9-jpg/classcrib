import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Submission from '@/models/Submission';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isStudentFeatureEnabled } from '@/lib/student-access';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = session.user as { id: string; role?: string };
    const userId = sessionUser.id;
    await dbConnect();

    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userClasses = user.workspaces?.length ? user.workspaces : user.classes || [];
    if (sessionUser.role === 'Student' && !(await isStudentFeatureEnabled(userId, 'allowCribbyAI'))) {
      return NextResponse.json({ error: 'Cribby AI is disabled by a class administrator.' }, { status: 403 });
    }
    const completedTaskIds = await Submission.find({
      student: userId,
      status: { $in: ['Pending', 'Approved'] },
    }).distinct('task');
    const tasks = userClasses.length
      ? await Task.find({
          $and: [
            { $or: [
              { class: { $in: userClasses } },
              { workspace: { $in: userClasses } },
              { classes: { $in: userClasses } },
            ] },
            { $or: [
              { assignedStudents: { $exists: false } },
              { assignedStudents: { $size: 0 } },
              { assignedStudents: userId },
            ] },
          ],
          _id: { $nin: completedTaskIds },
        }).sort({ dueDate: 1 }).limit(5).lean()
      : [];
    const overdueTasks = tasks.filter((task) => new Date(task.dueDate).getTime() < Date.now());
    const overdueTask = overdueTasks[0];
    const nextTask = tasks[0];
    const title = (overdueTask?.title || nextTask?.title || "").replace(/[\r\n<>]/g, " ").slice(0, 80);
    const tipContent = overdueTask
      ? `Your assignment "${title}" is overdue. Ask your teacher if you need help catching up.`
      : nextTask
        ? `Your next task is "${title}". Start early and ask your teacher if anything is unclear.`
        : "You’re all caught up. Keep building good study habits one step at a time.";

    return NextResponse.json({ 
      tip: {
        content: tipContent,
        type: overdueTask ? 'warning' : 'info'
      } 
    });

  } catch (error) {
    console.error('Tips API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load a study tip.' }, { status: 500 });
  }
}
