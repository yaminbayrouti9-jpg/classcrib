import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await req.json();
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    await dbConnect();

    const workspace = await Class.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!workspace) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const userId = (session.user as any).id;

    // Check if student is already in the workspace
    const isMember = workspace.students.some((id: any) => id.toString() === userId);
    if (isMember) {
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 400 });
    }

    // Add student to workspace
    workspace.students.push(userId);
    await workspace.save();

    // Add workspace to student's record
    await User.findByIdAndUpdate(userId, {
      $addToSet: { workspaces: workspace._id }
    });

    return NextResponse.json({ success: true, workspaceName: workspace.name });
  } catch (error: any) {
    console.error("Join workspace error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
