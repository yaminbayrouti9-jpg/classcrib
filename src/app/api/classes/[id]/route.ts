import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import Task from "@/models/Task";
import User from "@/models/User";
import ChatReport from "@/models/ChatReport";
import mongoose from "mongoose";
import School from "@/models/School";
import { isStudentFeatureEnabled } from "@/lib/student-access";

// GET /api/classes/[id] - Get class details (posts + assignments)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const targetClass = await Class.findById(id)
      .populate('teacher', 'username displayName')
      .populate('students', 'username displayName level');

    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Verify membership
    const isTeacher = targetClass.teacher._id.toString() === userId;
    const isStudent = targetClass.students.some((s: any) => s._id.toString() === userId);
    const isSchoolAdmin = (session.user as any).role === 'SchoolAdmin' &&
      targetClass.school?.toString() === (session.user as any).schoolId;

    if (!isTeacher && !isStudent && !isSchoolAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    // Fetch assignments for this class
    const assignments = await Task.find({ $or: [{ class: id }, { classes: id }] }).sort({ dueDate: 1 });

    const classResponse: Record<string, unknown> = targetClass.toObject();
    const chatEnabled = !isStudent || (
      (await isStudentFeatureEnabled(userId, "allowClassChat")) &&
      targetClass.settings?.allowClassChat !== false
    );
    if (!chatEnabled) classResponse.posts = [];
    return NextResponse.json({ 
      class: classResponse,
      assignments,
      isTeacher,
      isSchoolAdmin,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch class details" }, { status: 500 });
  }
}

// POST /api/classes/[id]/posts - Add a new message
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { content, reportPostId } = await req.json();
  const { id } = await params;
  const user = session.user as any;

  try {
    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const isTeacher = targetClass.teacher.toString() === user.id;
    const isStudent = targetClass.students.some((s: any) => s.toString() === user.id);

    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    if (reportPostId) {
      if (!mongoose.isValidObjectId(reportPostId) || !targetClass.posts.some((post: any) => post._id.toString() === reportPostId)) {
        return NextResponse.json({ error: "Message not found." }, { status: 404 });
      }
      try {
        await ChatReport.create({ classId: id, postId: reportPostId, reporter: user.id });
      } catch (error) {
        if ((error as { code?: number })?.code === 11000) {
          return NextResponse.json({ error: "You have already reported this message." }, { status: 409 });
        }
        throw error;
      }
      return NextResponse.json({ success: true, message: "Report sent to your teacher." });
    }

    if (targetClass.school && !(await isStudentFeatureEnabled(user.id, 'allowClassChat')) &&
        user.role === 'Student') {
      return NextResponse.json({ error: "Class chat is disabled by your school." }, { status: 403 });
    }
    if (targetClass.school) {
      const school = await School.findById(targetClass.school).select('settings.allowClassChat');
      if (school?.settings.allowClassChat === false) {
        return NextResponse.json({ error: "Class chat is disabled by your school." }, { status: 403 });
      }
    }
    if (targetClass.settings?.allowClassChat === false) {
      return NextResponse.json({ error: "Class chat is disabled." }, { status: 403 });
    }
    // Check student post permission
    if (isStudent && !targetClass.settings?.allowStudentPosts) {
      return NextResponse.json({ error: "Student posting is disabled" }, { status: 403 });
    }
    if (typeof content !== "string" || content.trim().length < 1 || content.length > 2000) {
      return NextResponse.json({ error: "Message must contain 1 to 2,000 characters." }, { status: 400 });
    }

    const newPost = {
      author: user.id,
      authorName: user.username || user.name,
      content,
      role: user.role,
      createdAt: new Date()
    };

    targetClass.posts.push(newPost);
    await targetClass.save();

    return NextResponse.json({ post: newPost });
  } catch (error) {
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}

// PATCH /api/classes/[id]/settings - Update class settings (Teacher only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { settings } = await req.json();
  const { id } = await params;
  const userId = (session.user as any).id;

  try {
    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (targetClass.teacher.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedSettings = [
      'allowStudentPosts',
      'allowClassChat',
      'allowUsernameSearch',
      'allowCoinGifts',
      'allowLeaderboard',
      'allowTradingTerminal',
      'allowCribbyAI',
    ];
    if (!settings || typeof settings !== 'object' ||
        Object.keys(settings).some((key) => !allowedSettings.includes(key)) ||
        Object.values(settings).some((value) => typeof value !== 'boolean')) {
      return NextResponse.json({ error: "Invalid class setting." }, { status: 400 });
    }
    if (targetClass.school) {
      const school = await School.findById(targetClass.school).select('settings');
      const schoolControlled: Record<string, keyof NonNullable<typeof school>["settings"]> = {
        allowClassChat: "allowClassChat",
        allowUsernameSearch: "allowUsernameSearch",
        allowCoinGifts: "allowCoinGifts",
        allowTradingTerminal: "allowTradingTerminal",
        allowCribbyAI: "allowCribbyAI",
      };
      for (const [key, schoolKey] of Object.entries(schoolControlled)) {
        if (settings[key] === true && school?.settings[schoolKey] === false) {
          return NextResponse.json({ error: `${key} is disabled by the school administrator.` }, { status: 403 });
        }
      }
    }
    targetClass.settings = { ...targetClass.settings, ...settings };
    await targetClass.save();

    return NextResponse.json({ settings: targetClass.settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
// DELETE /api/classes/[id] - Remove a student from class (Teacher only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { studentId } = await req.json();
  const { id } = await params;
  const userId = (session.user as any).id;

  try {
    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (targetClass.teacher.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    targetClass.students = targetClass.students.filter((s: any) => s.toString() !== studentId);
    await targetClass.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove student" }, { status: 500 });
  }
}

// PUT /api/classes/[id] - Add a student manually (Teacher only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { username } = await req.json();
  const { id } = await params;
  const teacherId = (session.user as any).id;

  try {
    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (targetClass.teacher.toString() !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32) {
      return NextResponse.json({ error: "Enter a valid student username." }, { status: 400 });
    }
    const student = await User.findOne({ username: username.trim().toLowerCase(), role: 'Student' });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (student.school && (!targetClass.school || targetClass.school.toString() !== student.school.toString())) {
      return NextResponse.json({ error: "Student belongs to another school." }, { status: 403 });
    }

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const update: Record<string, unknown> = {
          $addToSet: { workspaces: targetClass._id, classes: targetClass._id },
        };
        const setFields: Record<string, unknown> = {};
        if (targetClass.school && !student.school) setFields.school = targetClass.school;
        if (targetClass.yearGroup && !student.schoolYear) setFields.schoolYear = targetClass.yearGroup;
        if (Object.keys(setFields).length) update.$set = setFields;
        const studentUpdated = await User.updateOne({
          _id: student._id,
          role: "Student",
          ...(targetClass.school ? { $or: [{ school: targetClass.school }, { school: null }] } : {}),
        }, update, { session: mongoSession });
        if (!studentUpdated.matchedCount) throw new Error("SCHOOL_MISMATCH");
        const classUpdated = await Class.updateOne(
          { _id: targetClass._id, teacher: teacherId, students: { $ne: student._id } },
          { $addToSet: { students: student._id } },
          { session: mongoSession },
        );
        if (!classUpdated.modifiedCount) throw new Error("ALREADY_IN_CLASS");
      });
    } catch (error) {
      if (error instanceof Error && error.message === "SCHOOL_MISMATCH") return NextResponse.json({ error: "Student belongs to another school." }, { status: 403 });
      if (error instanceof Error && error.message === "ALREADY_IN_CLASS") return NextResponse.json({ error: "Student already in class" }, { status: 409 });
      throw error;
    } finally {
      await mongoSession.endSession();
    }
    return NextResponse.json({ success: true, student: { _id: student._id, username: student.username } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}
