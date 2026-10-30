import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import Class from "@/models/Class";
import User from "@/models/User";
import Notification from "@/models/Notification";
import ParentLink from "@/models/ParentLink";
import Submission from "@/models/Submission";
import BehaviorPoint from "@/models/BehaviorPoint";
import { sendSchoolEmail } from "@/lib/email";

const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

async function createRecurringAssignments(now: Date) {
  let created = 0;
  const roots = await Task.find({
    "recurrence.frequency": { $in: ["daily", "weekly"] },
    nextOccurrenceAt: { $lte: now },
  }).limit(200);
  for (const root of roots) {
    if (!root.recurrence || !["daily", "weekly"].includes(root.recurrence.frequency)) continue;
    while (root.nextOccurrenceAt && root.nextOccurrenceAt <= now && root.nextOccurrenceAt <= (root.recurrence.until || new Date(0)) && created < 1000) {
      const occurrenceDate = new Date(root.nextOccurrenceAt);
      const interval = root.recurrence.frequency === "daily" ? DAY_MS : 7 * DAY_MS;
      const nextDate = new Date(occurrenceDate.getTime() + interval);
      const mongoSession = await mongoose.startSession();
      try {
        await mongoSession.withTransaction(async () => {
          const currentRoot = await Task.findOne({
            _id: root._id,
            nextOccurrenceAt: occurrenceDate,
            "recurrence.frequency": { $in: ["daily", "weekly"] },
          }).session(mongoSession);
          if (!currentRoot) return;
          const newTask = await Task.create([{
            title: currentRoot.title,
            description: currentRoot.description,
            type: currentRoot.type,
            difficulty: currentRoot.difficulty,
            coins: currentRoot.coins,
            xp: currentRoot.xp,
            dueDate: occurrenceDate,
            class: currentRoot.class,
            classes: currentRoot.classes,
            assignedStudents: currentRoot.assignedStudents,
            attachments: currentRoot.attachments,
            postToClassChat: currentRoot.postToClassChat,
            recurrence: { frequency: "none" },
            occurrenceKey: `${currentRoot._id}:${occurrenceDate.toISOString()}`,
            creator: currentRoot.creator,
          }], { session: mongoSession });
          const classIds = currentRoot.classes?.length ? currentRoot.classes : [currentRoot.class].filter(Boolean);
          const students = await Class.find({ _id: { $in: classIds } }).distinct("students");
          const recipients = students
            .map((id) => id.toString())
            .filter((id) => !currentRoot.assignedStudents?.length || currentRoot.assignedStudents.some((studentId) => studentId.toString() === id));
          if (recipients.length) {
            await Notification.insertMany(recipients.map((recipient) => ({
              recipient,
              sender: currentRoot.creator,
              type: "Assignment",
              title: "Recurring assignment",
              message: `"${currentRoot.title}" is due ${occurrenceDate.toLocaleDateString()}.`,
              link: "/tasks",
            })), { session: mongoSession });
          }
          if (currentRoot.postToClassChat && classIds.length) {
            const teacher = await User.findById(currentRoot.creator).select("username displayName").session(mongoSession);
            await Class.updateMany({ _id: { $in: classIds } }, {
              $push: {
                posts: {
                  author: currentRoot.creator,
                  authorName: teacher?.displayName || teacher?.username || "Teacher",
                  role: "Teacher",
                  content: `New assignment: ${currentRoot.title}`,
                  createdAt: now,
                },
              },
            }, { session: mongoSession });
          }
          currentRoot.nextOccurrenceAt = nextDate <= (currentRoot.recurrence?.until || new Date(0)) ? nextDate : undefined;
          await currentRoot.save({ session: mongoSession });
          created += newTask.length;
        });
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error;
      } finally {
        await mongoSession.endSession();
      }
      if (root.nextOccurrenceAt) {
        root.nextOccurrenceAt = nextDate <= (root.recurrence?.until || new Date(0)) ? nextDate : undefined;
      }
    }
    if (created >= 1000) break;
  }
  return created;
}

async function sendAssignmentReminders(now: Date) {
  const tasks = await Task.find({
    dueDate: { $gt: now, $lte: new Date(now.getTime() + DAY_MS) },
    reminderSentAt: { $exists: false },
  }).limit(500).select("_id title creator dueDate class classes assignedStudents");
  let sent = 0;
  for (const task of tasks) {
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const claimed = await Task.findOneAndUpdate(
          { _id: task._id, reminderSentAt: { $exists: false } },
          { $set: { reminderSentAt: now } },
          { new: true, session: mongoSession },
        );
        if (!claimed) return;
        const classIds = claimed.classes?.length ? claimed.classes : [claimed.class].filter(Boolean);
        const classStudentIds = await Class.find({ _id: { $in: classIds } }).distinct("students");
        const targetIds = classStudentIds
          .map((id) => id.toString())
          .filter((id) => !claimed.assignedStudents?.length || claimed.assignedStudents.some((studentId) => studentId.toString() === id));
        const students = await User.find({
          _id: { $in: targetIds },
          role: "Student",
          "settings.taskReminders": { $ne: false },
        }).select("_id");
        if (students.length) {
          await Notification.insertMany(students.map((student) => ({
            recipient: student._id,
            sender: claimed.creator,
            type: "Assignment",
            title: "Assignment due soon",
            message: `"${claimed.title}" is due within 24 hours.`,
            link: "/tasks",
          })), { session: mongoSession });
        }
        sent += students.length;
      });
    } finally {
      await mongoSession.endSession();
    }
  }
  return sent;
}

async function sendWeeklyParentDigests(now: Date) {
  if (!process.env.RESEND_API_KEY || !process.env.SCHOOL_EMAIL_FROM) return 0;
  const oneWeekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const links = await ParentLink.find({ weeklyEmail: true })
    .populate("parent", "email")
    .populate("student", "username displayName workspaces classes")
    .populate("school", "name settings.parentWeeklyEmailEnabled")
    .limit(1000)
    .lean();
  let sent = 0;
  for (const link of links) {
    const school = link.school as unknown as { name?: string; settings?: { parentWeeklyEmailEnabled?: boolean } } | null;
    const parent = link.parent as unknown as { email?: string } | null;
    const student = link.student as unknown as { username: string; displayName?: string; workspaces?: string[]; classes?: string[] } | null;
    if (!school?.settings?.parentWeeklyEmailEnabled || !parent?.email || !student) continue;
    const lastSent = link.lastWeeklyEmailAt ? new Date(link.lastWeeklyEmailAt) : null;
    if (lastSent && lastSent > oneWeekAgo) continue;
    const updatedLink = await ParentLink.findOneAndUpdate({
      _id: link._id,
      weeklyEmail: true,
      $or: [{ lastWeeklyEmailAt: { $exists: false } }, { lastWeeklyEmailAt: { $lte: oneWeekAgo } }],
    }, { $set: { lastWeeklyEmailAt: now } }, { new: true });
    if (!updatedLink) continue;
    try {
      const classIds = student.workspaces?.length ? student.workspaces : student.classes || [];
      const audienceFilter = {
        $and: [
          { $or: [{ class: { $in: classIds } }, { classes: { $in: classIds } }] },
          { $or: [
            { assignedStudents: { $exists: false } },
            { assignedStudents: { $size: 0 } },
            { assignedStudents: link.student },
          ] },
        ],
      };
      const weekEnd = new Date(now.getTime() + 7 * DAY_MS);
      const upcomingTasks = classIds.length
        ? await Task.find({ ...audienceFilter, dueDate: { $gte: now, $lte: weekEnd } }).select("_id title dueDate")
        : [];
      const overdueTasks = classIds.length
        ? await Task.find({ ...audienceFilter, dueDate: { $lt: now } }).select("_id dueDate")
        : [];
      const submittedOverdueTasks = overdueTasks.length
        ? await Submission.distinct("task", {
          student: link.student,
          task: { $in: overdueTasks.map((task) => task._id) },
        })
        : [];
      const submittedTaskIds = new Set(submittedOverdueTasks.map((taskId) => taskId.toString()));
      const overdue = overdueTasks.filter((task) => !submittedTaskIds.has(task._id.toString())).length;
      const submissions = await Submission.countDocuments({ student: link.student, createdAt: { $gte: oneWeekAgo } });
      const behavior = await BehaviorPoint.aggregate([
        { $match: { student: link.student, status: "Approved", createdAt: { $gte: oneWeekAgo } } },
        { $group: { _id: null, points: { $sum: "$points" } } },
      ]);
      const name = escapeHtml(student.displayName || student.username);
      const emailSent = await sendSchoolEmail({
        to: parent.email,
        subject: `Weekly ClassCrib progress for ${student.displayName || student.username}`,
        html: `<h2>Weekly progress for ${name}</h2><p>School: ${escapeHtml(school.name || "Your school")}</p><p>Assignments due in the next 7 days: ${upcomingTasks.length}. Overdue and not yet submitted: ${overdue}. Submissions this week: ${submissions}.</p><p>Behaviour points this week: ${behavior[0]?.points || 0}.</p>`,
      });
      if (emailSent) sent++;
    } catch (error) {
      await ParentLink.updateOne({ _id: link._id, lastWeeklyEmailAt: now }, { $unset: { lastWeeklyEmailAt: 1 } });
      console.error("Weekly parent email failed:", error);
    }
  }
  return sent;
}

async function removeOrphanedAttachments(now: Date) {
  const database = mongoose.connection.db;
  if (!database) throw new Error("Database connection is unavailable.");
  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "assignmentAttachments" });
  const cutoff = new Date(now.getTime() - DAY_MS);
  const files = await bucket.find({ uploadDate: { $lt: cutoff } }).limit(200).toArray();
  let removed = 0;
  for (const file of files) {
    const url = `/api/attachments/${file._id.toString()}`;
    if (await Task.exists({ "attachments.url": url })) continue;
    await bucket.delete(file._id);
    removed++;
  }
  return removed;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  await dbConnect();
  const now = new Date();
  const recurringAssignments = await createRecurringAssignments(now);
  const remindersSent = await sendAssignmentReminders(now);
  const weeklyEmailsSent = await sendWeeklyParentDigests(now);
  const orphanedAttachmentsRemoved = await removeOrphanedAttachments(now);
  return NextResponse.json({ recurringAssignments, remindersSent, weeklyEmailsSent, orphanedAttachmentsRemoved });
}
