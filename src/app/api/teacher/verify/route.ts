import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Task from '@/models/Task';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLevelFromXp } from '@/lib/leveling';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import Class from '@/models/Class';
import School from '@/models/School';
import RewardApproval from '@/models/RewardApproval';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId, status, feedback } = await req.json();

    if (!mongoose.isValidObjectId(submissionId) || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (feedback !== undefined && (typeof feedback !== 'string' || feedback.length > 2000)) {
      return NextResponse.json({ error: 'Feedback must be 2,000 characters or fewer.' }, { status: 400 });
    }

    await dbConnect();
    const teacherId = (session.user as any).id;
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const submission = await Submission.findOne({ _id: submissionId, status: 'Pending' })
          .populate('task')
          .session(mongoSession);
        if (!submission) throw new Error('SUBMISSION_ALREADY_PROCESSED');

        const task = submission.task as any;
        if (!task || task.creator?.toString() !== teacherId) {
          throw new Error('SUBMISSION_NOT_OWNED');
        }

        const claimed = await Submission.findOneAndUpdate(
          { _id: submissionId, status: 'Pending' },
          {
            $set: {
              status,
              feedback,
              verifiedAt: new Date(),
              verifiedBy: teacherId,
            },
          },
          { new: true, session: mongoSession }
        );
        if (!claimed) throw new Error('SUBMISSION_ALREADY_PROCESSED');

        if (status === 'Approved') {
          const student = await User.findById(submission.student).session(mongoSession);
          if (!student) throw new Error('STUDENT_NOT_FOUND');
          const reward = Math.max(0, Number(task.coins) || 0);
          const xpReward = Math.max(0, Number(task.xp) || 0);
          const targetClassId = submission.class || task.class;
          const targetClass = await Class.findOne({ _id: targetClassId, teacher: teacherId }).select('school').session(mongoSession);
          if (!targetClass) throw new Error('CLASS_NOT_OWNED');
          const school = targetClass.school
            ? await School.findById(targetClass.school).select('settings.rewardsByTaskType').session(mongoSession)
            : null;
          const ruleKey = String(task.type || 'Homework').toLowerCase() as 'homework' | 'green' | 'physical' | 'activity';
          const rewardRule = school?.settings.rewardsByTaskType?.[ruleKey] ?? {
            coinsPerAward: 500,
            xpPerAward: 1000,
            coinsPerStudentPerDay: 1000,
            xpPerStudentPerDay: 2000,
          };
          const startOfDay = new Date();
          startOfDay.setUTCHours(0, 0, 0, 0);
          const [dailyTotal] = await Transaction.aggregate([
            { $match: { user: student._id, source: { $in: ['teacher-award', 'assignment-reward'] }, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, coins: { $sum: '$amount' }, xp: { $sum: '$xpAmount' } } },
          ]).session(mongoSession);
          const needsApproval = reward > rewardRule.coinsPerAward ||
            xpReward > rewardRule.xpPerAward ||
            (dailyTotal?.coins || 0) + reward > rewardRule.coinsPerStudentPerDay ||
            (dailyTotal?.xp || 0) + xpReward > rewardRule.xpPerStudentPerDay;
          if (needsApproval && !school) throw new Error('REWARD_APPROVAL_UNAVAILABLE');
          if (needsApproval && school) {
            await RewardApproval.create([{
              school: school._id,
              class: targetClass._id,
              teacher: teacherId,
              students: [student._id],
              coins: reward,
              xp: xpReward,
              taskType: task.type || 'Homework',
              reason: `Approved assignment: ${task.title}`,
              idempotencyKey: `assignment:${submissionId}`,
              source: 'assignment',
              submission: submission._id,
              status: 'Pending',
            }], { session: mongoSession });
            claimed.rewardStatus = 'PendingApproval';
            await claimed.save({ session: mongoSession });
            await Task.updateOne(
              { _id: task._id },
              { $addToSet: { completions: { student: submission.student, completedAt: new Date(), bonusEarned: 0, verified: true } } },
              { session: mongoSession },
            );
            const admins = await User.find({ school: school._id, role: 'SchoolAdmin' }).distinct('_id').session(mongoSession);
            if (admins.length) {
              await Notification.insertMany(admins.map((adminId) => ({
                recipient: adminId,
                sender: teacherId,
                type: 'System',
                title: 'Assignment reward requires approval',
                message: `A reward of ${reward} coins and ${xpReward} XP is awaiting review.`,
                link: '/school-admin',
              })), { session: mongoSession });
            }
            await Notification.create([{
              recipient: submission.student,
              sender: teacherId,
              type: 'Verification',
              title: 'Task Approved — Reward Pending',
              message: `Your work for "${task.title}" was approved. The school administrator must approve its reward.`,
              link: '/tasks',
            }], { session: mongoSession });
            return;
          }
          const currentEarnings = student.weeklyEarnings || 0;
          const weeklyCap = student.weeklyCap || 5000;
          const coinAward = Math.min(reward, Math.max(0, weeklyCap - currentEarnings));
          const newXp = (student.xp || 0) + xpReward;
          student.coins = (student.coins || 0) + coinAward;
          student.weeklyEarnings = currentEarnings + coinAward;
          student.xp = newXp;
          student.level = getLevelFromXp(newXp);
          await student.save({ session: mongoSession });
          claimed.rewardStatus = 'Awarded';
          await claimed.save({ session: mongoSession });
          await Task.updateOne(
            { _id: task._id },
            { $addToSet: { completions: { student: submission.student, completedAt: new Date(), bonusEarned: coinAward, verified: true } } },
            { session: mongoSession },
          );

          await Transaction.create([{
            user: student._id,
            amount: coinAward,
            xpAmount: xpReward,
            type: 'Income',
            description: `Assignment: ${task.title}`,
            reason: `Approved assignment: ${task.title}`,
            category: 'Task',
            source: 'assignment-reward',
            awardedBy: teacherId,
            awardedAt: new Date(),
          }], { session: mongoSession });

          await Notification.create([{
            recipient: submission.student,
            sender: teacherId,
            type: 'Verification',
            title: 'Task Approved!',
            message: `Your work for "${task.title}" was approved. You earned ${coinAward} Coins and ${xpReward} XP.`,
            link: '/tasks'
          }], { session: mongoSession });
        } else {
          await Notification.create([{
            recipient: submission.student,
            sender: teacherId,
            type: 'Verification',
            title: 'Task Needs Work',
            message: `Your submission for "${task.title}" was rejected. Feedback: ${feedback || 'Please try again.'}`,
            link: '/tasks'
          }], { session: mongoSession });
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'SUBMISSION_ALREADY_PROCESSED') {
        return NextResponse.json({ error: 'Submission already processed.' }, { status: 409 });
      }
      if (error instanceof Error && error.message === 'SUBMISSION_NOT_OWNED') {
        return NextResponse.json({ error: 'You are not authorized to review this submission.' }, { status: 403 });
      }
      if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') {
        return NextResponse.json({ error: 'Student account no longer exists.' }, { status: 404 });
      }
      if (error instanceof Error && error.message === 'CLASS_NOT_OWNED') {
        return NextResponse.json({ error: 'The assignment class is no longer available to this teacher.' }, { status: 403 });
      }
      if (error instanceof Error && error.message === 'REWARD_APPROVAL_UNAVAILABLE') {
        return NextResponse.json({ error: 'The assignment reward exceeds limits, but no school administrator is configured for approval.' }, { status: 422 });
      }
      throw error;
    } finally {
      await mongoSession.endSession();
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error verifying submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
