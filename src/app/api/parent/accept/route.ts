import { NextResponse } from "next/server";
import { createHash } from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ParentInvite from "@/models/ParentInvite";
import ParentLink from "@/models/ParentLink";
import User from "@/models/User";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token.length > 200) return NextResponse.json({ error: "Invalid or expired invitation." }, { status: 400 });
  await dbConnect();
  const invite = await ParentInvite.findOne({ tokenHash: hashToken(token), acceptedAt: null, expiresAt: { $gt: new Date() } })
    .populate("student", "displayName username")
    .populate("school", "name")
    .lean() as {
      email: string;
      student: { username: string; displayName?: string };
      school: { name: string };
    } | null;
  if (!invite) return NextResponse.json({ error: "Invalid or expired invitation." }, { status: 404 });
  return NextResponse.json({ email: invite.email, student: invite.student, school: invite.school });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid acceptance request." }, { status: 400 });
  const { token, username, displayName, password } = body as Record<string, unknown>;
  if (typeof token !== "string" || token.length > 200 ||
      typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
      typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 100 ||
      typeof password !== "string" || password.length < 10 || password.length > 128) {
    return NextResponse.json({ error: "Provide the invite token, username, display name, and a 10-128 character password." }, { status: 400 });
  }
  const normalizedUsername = username.trim().toLowerCase();
  if (session?.user && (session.user as { role?: string }).role !== "Parent") {
    return NextResponse.json({ error: "Sign out before accepting a parent invitation." }, { status: 403 });
  }

  await dbConnect();
  const hashedPassword = session?.user ? undefined : await bcrypt.hash(password, 12);
  const mongoSession = await mongoose.startSession();
  let failure: "INVALID_INVITE" | "PARENT_EMAIL_EXISTS" | "USERNAME_EXISTS" | "ACCOUNT_MISMATCH" | null = null;
  let parentCreated = false;
  try {
    await mongoSession.withTransaction(async () => {
      failure = null;
      const invite = await ParentInvite.findOne({
        tokenHash: hashToken(token),
        acceptedAt: null,
        expiresAt: { $gt: new Date() },
      }).session(mongoSession);
      if (!invite) {
        failure = "INVALID_INVITE";
        return;
      }

      let parent = session?.user
        ? await User.findOne({ _id: (session.user as { id: string }).id, role: "Parent" }).session(mongoSession)
        : null;
      if (!parent) {
        if (session?.user) {
          failure = "ACCOUNT_MISMATCH";
          return;
        }
        if (await User.exists({ email: invite.email, role: "Parent" }).session(mongoSession)) {
          failure = "PARENT_EMAIL_EXISTS";
          return;
        }
        if (await User.exists({ username: normalizedUsername }).session(mongoSession)) {
          failure = "USERNAME_EXISTS";
          return;
        }
        [parent] = await User.create([{
          username: normalizedUsername,
          displayName: displayName.trim(),
          email: invite.email,
          password: hashedPassword,
          role: "Parent",
          school: invite.school,
          coins: 0,
        }], { session: mongoSession });
        parentCreated = true;
      } else if (parent.email?.toLowerCase() !== invite.email.toLowerCase() || parent.school?.toString() !== invite.school.toString()) {
        failure = "ACCOUNT_MISMATCH";
        return;
      }

      await ParentLink.updateOne(
        { parent: parent._id, student: invite.student },
        { $setOnInsert: { parent: parent._id, student: invite.student, school: invite.school } },
        { upsert: true, session: mongoSession },
      );
      const consumed = await ParentInvite.updateOne(
        { _id: invite._id, acceptedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { acceptedAt: new Date() } },
        { session: mongoSession },
      );
      if (!consumed.modifiedCount) {
        failure = "INVALID_INVITE";
        throw new Error("INVITE_ALREADY_CONSUMED");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message !== "INVITE_ALREADY_CONSUMED") {
      if ((error as { code?: number }).code === 11000) {
        return NextResponse.json({ error: "Username or parent account is already in use." }, { status: 409 });
      }
      console.error("Parent invitation acceptance failed:", error);
      return NextResponse.json({ error: "Unable to accept invitation right now." }, { status: 500 });
    }
    failure = "INVALID_INVITE";
  } finally {
    await mongoSession.endSession();
  }
  if (failure === "INVALID_INVITE") return NextResponse.json({ error: "Invalid, expired, or already used invitation." }, { status: 409 });
  if (failure === "PARENT_EMAIL_EXISTS") return NextResponse.json({ error: "A parent account already uses this email. Sign in to that account, then accept the invitation." }, { status: 409 });
  if (failure === "USERNAME_EXISTS") return NextResponse.json({ error: "Username is already in use." }, { status: 409 });
  if (failure === "ACCOUNT_MISMATCH") return NextResponse.json({ error: "This account does not match the invitation email and school." }, { status: 403 });
  return NextResponse.json({ success: true, requiresLogin: parentCreated });
}
