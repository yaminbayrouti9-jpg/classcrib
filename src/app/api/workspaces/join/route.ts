import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "Student") {
      return NextResponse.json({ error: "Only student accounts can join classes." }, { status: 403 });
    }

    const { inviteCode } = await req.json();
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    await dbConnect();

    if (typeof inviteCode !== "string" || inviteCode.trim().length !== 6) {
      return NextResponse.json({ error: "Enter a valid six-character invite code." }, { status: 400 });
    }

    const workspace = await Class.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!workspace) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const userId = (session.user as any).id;

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const student = await User.findOne({ _id: userId, role: "Student" }).session(mongoSession);
        if (!student) throw new Error("STUDENT_NOT_FOUND");
        if (student.school && (!workspace.school || student.school.toString() !== workspace.school.toString())) throw new Error("SCHOOL_MISMATCH");
        const joined = await Class.updateOne(
          { _id: workspace._id, students: { $ne: userId } },
          { $addToSet: { students: userId } },
          { session: mongoSession },
        );
        if (!joined.modifiedCount) throw new Error("ALREADY_JOINED");
        if (!student.workspaces.some((workspaceId) => workspaceId.equals(workspace._id))) student.workspaces.push(workspace._id);
        if (!student.classes.some((classId) => classId.equals(workspace._id))) student.classes.push(workspace._id);
        if (!student.school && workspace.school) student.school = workspace.school;
        if (!student.schoolYear && workspace.yearGroup) student.schoolYear = workspace.yearGroup;
        await student.save({ session: mongoSession });
      });
    } finally {
      await mongoSession.endSession();
    }

    return NextResponse.json({ success: true, workspaceName: workspace.name });
  } catch (error: any) {
    if (error instanceof Error && error.message === "SCHOOL_MISMATCH") return NextResponse.json({ error: "This account belongs to another school." }, { status: 403 });
    if (error instanceof Error && error.message === "ALREADY_JOINED") return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 409 });
    console.error("Join workspace error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
