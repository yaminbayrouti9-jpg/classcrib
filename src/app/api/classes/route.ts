import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import { nanoid } from "nanoid";

// GET /api/classes - List user's classes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    let classes;
    if (role === 'Teacher') {
      classes = await Class.find({ teacher: userId }).sort({ createdAt: -1 });
    } else {
      classes = await Class.find({ students: userId }).sort({ createdAt: -1 });
    }

    // Lazy update for classes missing banners
    const classesToUpdate = classes.filter(c => !c.banner);
    if (classesToUpdate.length > 0) {
      await Promise.all(classesToUpdate.map(c => {
        const aiBanner = `https://image.pollinations.ai/prompt/A%20beautiful%20abstract%20modern%20educational%20banner%20for%20a%20class%20named%20${encodeURIComponent(c.name)},%20high%20resolution,%20cinematic%20lighting,%204k?width=800&height=400&nologo=true`;
        return Class.findByIdAndUpdate(c._id, { banner: aiBanner });
      }));
      // Refresh list
      if (role === 'Teacher') {
        classes = await Class.find({ teacher: userId }).sort({ createdAt: -1 });
      } else {
        classes = await Class.find({ students: userId }).sort({ createdAt: -1 });
      }
    }

    return NextResponse.json({ classes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST /api/classes - Create a new class (Teacher only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { name, description, color } = await req.json();
  const userId = (session.user as any).id;

  try {
    // Generate an "AI-style" banner URL based on the class name
    const aiBanner = `https://image.pollinations.ai/prompt/abstract%20education%20pattern%20for%20${encodeURIComponent(name)}?width=800&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    const newClass = await Class.create({
      name,
      description,
      inviteCode: nanoid(6).toUpperCase(),
      teacher: userId,
      color: color || '#4F46E5',
      banner: aiBanner,
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
