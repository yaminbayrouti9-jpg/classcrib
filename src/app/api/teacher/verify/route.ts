import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Task from '@/models/Task';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLevelFromXp } from '@/lib/leveling';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId, status, feedback } = await req.json();

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const submission = await Submission.findById(submissionId).populate('task');
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'Pending') {
      return NextResponse.json({ error: 'Submission already processed' }, { status: 400 });
    }

    submission.status = status;
    submission.feedback = feedback;
    submission.verifiedAt = new Date();
    submission.verifiedBy = (session.user as any).id;
    await submission.save();

    const task = submission.task as any;

    if (status === 'Approved') {
      // Award coins and XP to student
      const student = await User.findById(submission.student);
      if (student) {
        const reward = task.coins || 0;
        const currentEarnings = student.weeklyEarnings || 0;
        const cap = student.weeklyCap || 5000;

        if (currentEarnings + reward <= cap) {
          student.coins += reward;
          student.weeklyEarnings = currentEarnings + reward;
        } else {
          // Award only up to the cap
          const partialReward = Math.max(0, cap - currentEarnings);
          student.coins += partialReward;
          student.weeklyEarnings = cap;
        }

        student.xp += (task.xp || 0);
        
        // Update level
        const newLevel = getLevelFromXp(student.xp);
        student.level = newLevel;
        
        await student.save();
      }

      // Notify Student
      await Notification.create({
        recipient: submission.student,
        sender: (session.user as any).id,
        type: 'Verification',
        title: 'Task Approved! 🎉',
        message: `Your work for "${task.title}" was approved. You earned ${task.coins} Coins and ${task.xp} XP!`,
        link: '/tasks'
      });
    } else {
      // Notify Student of Rejection
      await Notification.create({
        recipient: submission.student,
        sender: (session.user as any).id,
        type: 'Verification',
        title: 'Task Needs Work ✍️',
        message: `Your submission for "${task.title}" was rejected. Feedback: ${feedback || 'Please try again.'}`,
        link: '/tasks'
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error verifying submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
