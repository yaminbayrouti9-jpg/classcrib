import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { inviteCode } = await req.json();
  const userId = (session.user as any).id;

  try {
    const targetClass = await Class.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!targetClass) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    if (targetClass.students.includes(userId)) {
      return NextResponse.json({ error: "Already joined this class" }, { status: 400 });
    }

    targetClass.students.push(userId);
    await targetClass.save();

    // Also update user record to include this in their workspace list
    const User = (await import("@/models/User")).default;
    await User.findByIdAndUpdate(userId, { $addToSet: { workspaces: targetClass._id } });

    return NextResponse.json({ message: "Joined successfully", className: targetClass.name });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join class" }, { status: 500 });
  }
}
