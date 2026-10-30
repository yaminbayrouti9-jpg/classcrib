import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import User from "@/models/User";
import ParentInvite from "@/models/ParentInvite";
import { sendSchoolEmail } from "@/lib/email";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "Teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }
  const teacherId = (session.user as { id: string }).id;
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid invite request." }, { status: 400 });
  const { classId, studentId, email: providedEmail } = body as Record<string, unknown>;
  if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(studentId) ||
      (providedEmail !== undefined && (typeof providedEmail !== "string" || providedEmail.length > 254))) {
    return NextResponse.json({ error: "Provide a valid class, student, and parent email." }, { status: 400 });
  }

  await dbConnect();
  const targetClass = await Class.findOne({ _id: classId, teacher: teacherId }).select("_id school students");
  if (!targetClass || !targetClass.school || !targetClass.students.some((id) => id.toString() === studentId)) {
    return NextResponse.json({ error: "Student must belong to a school class you teach." }, { status: 403 });
  }
  const student = await User.findOne({ _id: studentId, role: "Student", school: targetClass.school }).select("parentEmail displayName username");
  if (!student) return NextResponse.json({ error: "Student not found in your school." }, { status: 404 });
  const email = (typeof providedEmail === "string" && providedEmail.trim() ? providedEmail : student.parentEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Add a valid parent email to the student or invite request." }, { status: 400 });
  }

  const token = randomBytes(32).toString("base64url");
  await ParentInvite.create({
    tokenHash: hashToken(token),
    email,
    student: student._id,
    school: targetClass.school,
    invitedBy: teacherId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const url = new URL("/parent/accept", process.env.NEXTAUTH_URL || req.url);
  url.searchParams.set("token", token);
  let delivered = false;
  let emailWarning: string | undefined;
  try {
    delivered = await sendSchoolEmail({
      to: email,
      subject: "Invitation to view your student's ClassCrib progress",
      html: `<p>You have been invited to a read-only ClassCrib parent account for ${escapeHtml(student.displayName || student.username)}.</p><p><a href="${url.toString()}">Accept invitation</a></p><p>This link expires in seven days.</p>`,
    });
  } catch (error) {
    console.error("Parent invitation email failed:", error);
    emailWarning = "Email delivery failed. Copy the invitation link and share it securely.";
  }
  return NextResponse.json({ success: true, inviteUrl: url.toString(), emailSent: delivered, emailWarning }, { status: 201 });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}
