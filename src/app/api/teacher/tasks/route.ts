import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Class from '@/models/Class';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

type SessionUser = { id?: string; role?: string; username?: string; name?: string | null };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function parseRecurrenceEnd(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, yearText, monthText, dayText] = dateOnly;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const startOfDate = new Date(Date.UTC(year, month - 1, day));
    if (startOfDate.getUTCFullYear() !== year ||
        startOfDate.getUTCMonth() !== month - 1 ||
        startOfDate.getUTCDate() !== day) return undefined;
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.id || user.role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, description, type, coins, xp, dueDate, workspaceId, classIds, studentIds,
      attachments, recurrence, postToClassChat,
    } = body;
    const teacherId = user.id;
    const targetClassIds: string[] = Array.isArray(classIds) && classIds.length ? classIds : workspaceId ? [workspaceId] : [];
    if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200 ||
        typeof description !== 'string' || description.length > 10_000 ||
        !Number.isSafeInteger(coins) || coins < 0 || coins > 500 ||
        !Number.isSafeInteger(xp) || xp < 0 || xp > 1000 ||
        !['Homework', 'Green', 'Physical', 'Activity'].includes(type) ||
        !Number.isFinite(Date.parse(dueDate)) ||
        targetClassIds.length < 1 || targetClassIds.length > 20 ||
        targetClassIds.some((id) => !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ error: 'Check the title, instructions, reward limits, due date, and target classes.' }, { status: 400 });
    }
    if (attachments !== undefined &&
        (!Array.isArray(attachments) || attachments.length > 10 ||
         attachments.some((item: unknown) => {
           if (!item || typeof item !== "object") return true;
           const attachment = item as Record<string, unknown>;
           return typeof attachment.name !== "string" || attachment.name.length < 1 || attachment.name.length > 150 ||
             typeof attachment.url !== "string" || attachment.url.length > 2048 ||
             (!/^https:\/\//i.test(attachment.url) &&
               !/^\/api\/attachments\/[a-f\d]{24}$/i.test(attachment.url));
         }))) {
      return NextResponse.json({ error: 'Attachments must be HTTPS links or uploaded assignment files.' }, { status: 400 });
    }
    if (studentIds !== undefined &&
        (!Array.isArray(studentIds) || studentIds.length > 500 ||
         studentIds.some((id: unknown) => typeof id !== 'string' || !mongoose.isValidObjectId(id)))) {
      return NextResponse.json({ error: 'Invalid individual student selection.' }, { status: 400 });
    }
    if (recurrence && !['none', 'daily', 'weekly'].includes(recurrence.frequency)) {
      return NextResponse.json({ error: 'Invalid recurrence frequency.' }, { status: 400 });
    }
    const parsedDueDate = new Date(dueDate);
    const recurrenceUntil = recurrence?.until ? parseRecurrenceEnd(recurrence.until) : undefined;
    if (recurrence?.frequency && recurrence.frequency !== "none" &&
        (!recurrenceUntil || Number.isNaN(recurrenceUntil.getTime()) || recurrenceUntil <= parsedDueDate)) {
      return NextResponse.json({ error: "Recurring assignments need an end date later than the first due date." }, { status: 400 });
    }

    await dbConnect();
    const classes = await Class.find({ _id: { $in: targetClassIds }, teacher: teacherId }).select('_id students name');
    if (classes.length !== targetClassIds.length) {
      return NextResponse.json({ error: 'One or more selected classes are not yours.' }, { status: 403 });
    }
    const eligibleStudentIds = new Set(classes.flatMap((classDoc) => classDoc.students.map((id: mongoose.Types.ObjectId) => id.toString())));
    const assignedStudentIds: string[] = Array.isArray(studentIds) ? [...new Set(studentIds)] : [];
    if (assignedStudentIds.some((id) => !eligibleStudentIds.has(id))) {
      return NextResponse.json({ error: 'Selected students must be members of one of the selected classes.' }, { status: 403 });
    }
    const uploadedAttachments = (attachments || []).filter((item: { url: string }) => item.url.startsWith("/api/attachments/"));
    if (uploadedAttachments.length) {
      const database = mongoose.connection.db;
      if (!database) throw new Error("Database connection is unavailable.");
      const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "assignmentAttachments" });
      for (const attachment of uploadedAttachments) {
        const id = attachment.url.split("/").pop();
        if (!id || !mongoose.isValidObjectId(id)) {
          return NextResponse.json({ error: "Uploaded attachment reference is invalid." }, { status: 400 });
        }
        const [file] = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
        const allowedClassIds = file?.metadata?.classIds;
        if (file?.metadata?.uploaderId !== teacherId ||
            !Array.isArray(allowedClassIds) ||
            targetClassIds.some((classId) => !allowedClassIds.includes(classId))) {
          return NextResponse.json({ error: "Every uploaded file must belong to this teacher and all selected classes." }, { status: 403 });
        }
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      type,
      coins,
      xp,
      dueDate: parsedDueDate,
      class: targetClassIds[0],
      classes: targetClassIds,
      assignedStudents: assignedStudentIds,
      attachments: attachments || [],
      recurrence: recurrence || { frequency: 'none' },
      nextOccurrenceAt: recurrence?.frequency && recurrence.frequency !== "none"
        ? new Date(parsedDueDate.getTime() + (recurrence.frequency === "daily" ? 86_400_000 : 7 * 86_400_000))
        : undefined,
      postToClassChat: postToClassChat === true,
      creator: teacherId,
    });

    const studentsToNotify = [...new Set(classes.flatMap((classDoc) => classDoc.students.map((studentId: mongoose.Types.ObjectId) => studentId.toString()))
      .filter((studentId) => assignedStudentIds.length === 0 || assignedStudentIds.includes(studentId)))];
    if (studentsToNotify.length > 0) {
      const studentNotifications = studentsToNotify.map((studentId) => ({
        recipient: studentId,
        sender: teacherId,
        type: 'Assignment',
        title: 'New Assignment!',
        message: `Task "${title.trim()}" has been assigned.`,
        link: '/tasks'
      }));
      await Notification.insertMany(studentNotifications);
    }
    if (postToClassChat) {
      await Promise.all(classes.map(async (classDoc) => {
        classDoc.posts.push({
          author: teacherId,
          authorName: user.username || user.name || 'Teacher',
          role: 'Teacher',
          content: `New assignment: ${title.trim()}`,
          createdAt: new Date(),
        });
        await classDoc.save();
      }));
    }

    return NextResponse.json({ success: true, task });
  } catch (error: unknown) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.id || user.role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const tasks = await Task.find({ creator: user.id })
      .populate('class', 'name students')
      .populate('classes', 'name students')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, tasks });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.id || user.role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await dbConnect();
    const deletedTask = await Task.findOneAndDelete({ 
      _id: taskId, 
      creator: user.id
    });

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
