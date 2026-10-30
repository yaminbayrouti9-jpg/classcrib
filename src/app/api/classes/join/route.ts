import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "Student") return NextResponse.json({ error: "Only student accounts can join classes." }, { status: 403 });

  await dbConnect();
  const { inviteCode } = await req.json();
  if (typeof inviteCode !== "string" || inviteCode.trim().length !== 6) return NextResponse.json({ error: "Enter a valid six-character invite code." }, { status: 400 });
  const userId = (session.user as any).id;

  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
    const targetClass = await Class.findOne({ inviteCode: inviteCode.trim().toUpperCase() }).session(mongoSession);
    
    if (!targetClass) throw new Error("CLASS_NOT_FOUND");
    const user = await User.findOne({ _id: userId, role: "Student" }).session(mongoSession);
    if (!user) throw new Error("STUDENT_NOT_FOUND");
    if (user.school && (!targetClass.school || user.school.toString() !== targetClass.school.toString())) throw new Error("SCHOOL_MISMATCH");
    const joined = await Class.updateOne(
      { _id: targetClass._id, students: { $ne: userId } },
      { $addToSet: { students: userId } },
      { session: mongoSession },
    );
    if (!joined.modifiedCount) throw new Error("ALREADY_JOINED");
    if (!user.workspaces.some((workspaceId) => workspaceId.equals(targetClass._id))) user.workspaces.push(targetClass._id);
    if (!user.classes.some((classId) => classId.equals(targetClass._id))) user.classes.push(targetClass._id);
    if (!user.school && targetClass.school) user.school = targetClass.school;
    if (!user.schoolYear && targetClass.yearGroup) user.schoolYear = targetClass.yearGroup;
    await user.save({ session: mongoSession });
    });
    return NextResponse.json({ message: "Joined successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "CLASS_NOT_FOUND") return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") return NextResponse.json({ error: "Student account not found." }, { status: 404 });
    if (error instanceof Error && error.message === "SCHOOL_MISMATCH") return NextResponse.json({ error: "This account belongs to another school." }, { status: 403 });
    if (error instanceof Error && error.message === "ALREADY_JOINED") return NextResponse.json({ error: "Already joined this class" }, { status: 409 });
    console.error("Class join failed:", error);
    return NextResponse.json({ error: "Failed to join class" }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
