import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import Task from "@/models/Task";
import User from "@/models/User";

// GET /api/classes/[id] - Get class details (posts + assignments)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const targetClass = await Class.findById(id)
      .populate('teacher', 'username email')
      .populate('students', 'username email level');

    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Verify membership
    const isTeacher = targetClass.teacher._id.toString() === userId;
    const isStudent = targetClass.students.some((s: any) => s._id.toString() === userId);

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch assignments for this class
    const assignments = await Task.find({ class: id }).sort({ dueDate: 1 });

    return NextResponse.json({ 
      class: targetClass, 
      assignments,
      isTeacher 
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
  const { content } = await req.json();
  const { id } = await params;
  const user = session.user as any;

  try {
    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const isTeacher = targetClass.teacher.toString() === user.id;
    const isStudent = targetClass.students.some((s: any) => s.toString() === user.id);

    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Check student post permission
    if (isStudent && !targetClass.settings?.allowStudentPosts) {
      return NextResponse.json({ error: "Student posting is disabled" }, { status: 403 });
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

    const student = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, role: 'Student' });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    if (targetClass.students.some((s: any) => s.toString() === student._id.toString())) {
      return NextResponse.json({ error: "Student already in class" }, { status: 400 });
    }

    targetClass.students.push(student._id);
    await targetClass.save();

    // Sync user workspaces
    await User.findByIdAndUpdate(student._id, { $addToSet: { workspaces: targetClass._id } });

    return NextResponse.json({ success: true, student: { _id: student._id, username: student.username } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}
