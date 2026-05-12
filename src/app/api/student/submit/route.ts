import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Task from '@/models/Task';
import Class from '@/models/Class';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, proofType, content, note, fileName } = await req.json();

    if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    if (!proofType) return NextResponse.json({ error: 'Missing proofType' }, { status: 400 });
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    await dbConnect();

    const task = await Task.findById(taskId).lean();
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const studentId = (session.user as any).id;
    const targetClassId = task.class || (task as any).workspace;

    if (!targetClassId) {
      console.error('Submission Error: Task has no class/workspace ID', { taskId, task });
      return NextResponse.json({ 
        error: 'Target class not found for this task. Please contact your teacher.',
        debug: { hasClass: !!task.class, hasWorkspace: !!(task as any).workspace }
      }, { status: 400 });
    }

    // 1. Handle Submission (Upsert if rejected, else create)
    const existingRejected = await Submission.findOne({
      student: studentId,
      task: taskId,
      status: 'Rejected'
    });

    let submission;
    if (existingRejected) {
      existingRejected.proofType = proofType;
      existingRejected.content = content;
      existingRejected.note = note;
      existingRejected.fileName = fileName;
      existingRejected.status = 'Pending';
      existingRejected.feedback = undefined;
      existingRejected.class = targetClassId; // Ensure class is set
      submission = await existingRejected.save();
    } else {
      submission = await Submission.create({
        student: studentId,
        task: taskId,
        class: targetClassId,
        proofType,
        content,
        note,
        fileName,
        status: 'Pending',
      });
    }

    // 2. Update Weekly Challenge Progress
    const user = await User.findById((session.user as any).id);
    if (user && user.currentChallenge) {
      // Find correctly mapped category
      const typeMap: Record<string, string> = {
        'Homework': 'Academic',
        'Green': 'Eco',
        'Physical': 'Physical'
      };
      const targetCategory = typeMap[task.type];
      
      const challengeIndex = user.currentChallenge.findIndex((c: any) => c.category === targetCategory && !c.completed);
      
      if (challengeIndex !== -1) {
        user.currentChallenge[challengeIndex].current += 1;
        if (user.currentChallenge[challengeIndex].current >= user.currentChallenge[challengeIndex].target) {
          user.currentChallenge[challengeIndex].completed = true;
        }
        await user.save();
      }
    }

    // 3. Notify Teacher
    const classData = await Class.findById(targetClassId);
    const studentName = user?.username || 'Student';
    if (classData && classData.teacher) {
      await Notification.create({
        recipient: classData.teacher,
        sender: (session.user as any).id,
        type: 'Submission',
        title: 'Work Submitted! 📝',
        message: `@${studentName} turned in "${task.title}".`,
        link: '/verify'
      });
    }

    return NextResponse.json({ success: true, submissionId: submission._id });

  } catch (error: any) {
    console.error('Error submitting work:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
