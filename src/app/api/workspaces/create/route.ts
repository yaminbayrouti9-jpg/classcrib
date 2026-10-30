import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    await dbConnect();

    const Class = (await import("@/models/Class")).default;
    const { nanoid } = await import("nanoid");

    if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 120) {
      return NextResponse.json({ error: "Workspace name must be between 1 and 120 characters." }, { status: 400 });
    }
    const teacher = await User.findById((session.user as any).id).select("school");

    const workspace = await Class.create({
      name: name.trim(),
      teacher: (session.user as any).id,
      school: teacher?.school,
      inviteCode: nanoid(6).toUpperCase(),
      students: [],
      posts: []
    });

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
