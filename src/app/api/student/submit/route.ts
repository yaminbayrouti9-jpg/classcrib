import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Task from '@/models/Task';
import Class from '@/models/Class';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, proofType, content, note, fileName } = await req.json();

    if (!mongoose.isValidObjectId(taskId)) return NextResponse.json({ error: 'Valid taskId is required.' }, { status: 400 });
    if (!['text', 'link', 'file'].includes(proofType)) return NextResponse.json({ error: 'Invalid proof type.' }, { status: 400 });
    if (typeof content !== 'string' || content.trim().length === 0 || content.length > 100_000) {
      return NextResponse.json({ error: 'Submission content must contain 1 to 100,000 characters.' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findById(taskId).lean();
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const studentId = (session.user as any).id;
    const taskClassIds = task.classes?.length
      ? task.classes.map((id: mongoose.Types.ObjectId) => id.toString())
      : [(task.class || (task as any).workspace)?.toString()];
    const targetClassId = taskClassIds[0];

    if (!targetClassId) {
      console.error('Submission Error: Task has no class/workspace ID', { taskId, task });
      return NextResponse.json({ 
        error: 'Target class not found for this task. Please contact your teacher.',
        debug: { hasClass: !!task.class, hasWorkspace: !!(task as any).workspace }
      }, { status: 400 });
    }

    const classes = await Class.find({ _id: { $in: taskClassIds } }).select('students teacher');
    const targetClass = classes.find((classDoc) =>
      classDoc.students.some((id: mongoose.Types.ObjectId) => id.toString() === studentId)
    );
    const isAssignedStudent = !task.assignedStudents?.length ||
      task.assignedStudents.some((id: mongoose.Types.ObjectId) => id.toString() === studentId);
    if (!targetClass || !isAssignedStudent) {
      return NextResponse.json({ error: 'You are not enrolled in the class assigned this task.' }, { status: 403 });
    }
    const submissionClassId = targetClass._id;

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
      existingRejected.class = submissionClassId;
      submission = await existingRejected.save();
    } else {
      try {
        submission = await Submission.create({
          student: studentId,
          task: taskId,
          class: submissionClassId,
          proofType,
          content,
          note,
          fileName,
          status: 'Pending',
        });
      } catch (error: any) {
        if (error?.code === 11000) {
          return NextResponse.json({ error: 'This assignment already has a submission.' }, { status: 409 });
        }
        throw error;
      }
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
    const classData = targetClass;
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
