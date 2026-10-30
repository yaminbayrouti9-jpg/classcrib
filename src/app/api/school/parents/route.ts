import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ParentLink from "@/models/ParentLink";
import User from "@/models/User";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid parent account request." }, { status: 400 });
  }

  const { username, displayName, email, password, studentId } = body as Record<string, unknown>;
  if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
      !/^[a-zA-Z0-9._-]+$/.test(username.trim()) ||
      typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 100 ||
      typeof email !== "string" || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || password.length < 10 || password.length > 128 ||
      typeof studentId !== "string" || !mongoose.isValidObjectId(studentId)) {
    return NextResponse.json({
      error: "Provide a valid username, parent name, email, 10-128 character password, and student.",
    }, { status: 400 });
  }

  await dbConnect();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const [student, usernameExists, parentEmailExists] = await Promise.all([
    User.findOne({ _id: studentId, role: "Student", school: schoolId }).select("_id"),
    User.exists({ username: normalizedUsername }),
    User.exists({ email: normalizedEmail, role: "Parent" }),
  ]);
  if (!student) return NextResponse.json({ error: "Select a student who belongs to your school." }, { status: 403 });
  if (usernameExists) return NextResponse.json({ error: "That username is already in use." }, { status: 409 });
  if (parentEmailExists) {
    return NextResponse.json({
      error: "A parent account already uses this email. Use the parent invitation flow to link the existing account to another student.",
    }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const mongoSession = await mongoose.startSession();
  try {
    let parentId: mongoose.Types.ObjectId | undefined;
    await mongoSession.withTransaction(async () => {
      if (!await User.exists({ _id: studentId, role: "Student", school: schoolId }).session(mongoSession)) {
        throw new Error("STUDENT_NOT_IN_SCHOOL");
      }
      if (await User.exists({ username: normalizedUsername }).session(mongoSession) ||
          await User.exists({ email: normalizedEmail, role: "Parent" }).session(mongoSession)) {
        throw new Error("PARENT_ACCOUNT_CONFLICT");
      }

      const [parent] = await User.create([{
        username: normalizedUsername,
        displayName: displayName.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: "Parent",
        school: schoolId,
        coins: 0,
      }], { session: mongoSession });
      await ParentLink.create([{
        parent: parent._id,
        student: studentId,
        school: schoolId,
      }], { session: mongoSession });
      parentId = parent._id;
    });

    return NextResponse.json({ success: true, parentId, username: normalizedUsername }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_NOT_IN_SCHOOL") {
      return NextResponse.json({ error: "Select a student who belongs to your school." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "PARENT_ACCOUNT_CONFLICT") {
      return NextResponse.json({ error: "The username or parent email was just registered. Check the details and try again." }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "The username or parent-student link already exists." }, { status: 409 });
    }
    console.error("School parent account creation failed:", error);
    return NextResponse.json({ error: "Unable to create and link the parent account." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
