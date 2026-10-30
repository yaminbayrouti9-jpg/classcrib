import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import { nanoid } from "nanoid";
import User from "@/models/User";

// GET /api/classes - List user's classes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    let classes;
    if (role === 'SchoolAdmin') {
      classes = await Class.find({ school: (session.user as any).schoolId })
        .populate('teacher', 'username displayName')
        .populate('students', 'username displayName')
        .sort({ createdAt: -1 });
    } else if (role === 'Teacher') {
      classes = await Class.find({ teacher: userId }).populate('students', 'username displayName').sort({ createdAt: -1 });
    } else {
      classes = await Class.find({ students: userId }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ classes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST /api/classes - Create a new class (Teacher only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['Teacher', 'SchoolAdmin'].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { name, description, color, teacherId: requestedTeacherId, yearGroup } = await req.json();
  const userId = (session.user as any).id;

  try {
    if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 120 ||
        (description !== undefined && (typeof description !== "string" || description.length > 1000)) ||
        (yearGroup !== undefined && (typeof yearGroup !== "string" || yearGroup.length > 40))) {
      return NextResponse.json({ error: "Provide a class name up to 120 characters and valid optional details." }, { status: 400 });
    }

    const user = await User.findById(userId).select('school');
    let teacherId = userId;
    if ((session.user as any).role === 'SchoolAdmin') {
      if (typeof requestedTeacherId !== 'string') {
        return NextResponse.json({ error: "Select a teacher for this class." }, { status: 400 });
      }
      const teacher = await User.findOne({ _id: requestedTeacherId, role: "Teacher", school: user?.school });
      if (!teacher) return NextResponse.json({ error: "Teacher must belong to your school." }, { status: 403 });
      teacherId = teacher._id.toString();
    }

    const newClass = await Class.create({
      name,
      description,
      inviteCode: nanoid(6).toUpperCase(),
      teacher: teacherId,
      school: user?.school,
      color: color || '#4F46E5',
      yearGroup: typeof yearGroup === "string" ? yearGroup.trim() : undefined,
      students: [],
      posts: []
    });

    return NextResponse.json({ class: newClass });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

// DELETE /api/classes - Delete a class (Teacher only)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { classId } = await req.json();
  const userId = (session.user as any).id;

  try {
    const deletedClass = await Class.findOneAndDelete({ _id: classId, teacher: userId });
    if (!deletedClass) return NextResponse.json({ error: "Class not found or unauthorized" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
