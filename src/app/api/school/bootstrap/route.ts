import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import School from "@/models/School";
import User from "@/models/User";
import BootstrapClaim from "@/models/BootstrapClaim";
import mongoose from "mongoose";

export async function POST(req: Request) {
  const bootstrapToken = process.env.SCHOOL_BOOTSTRAP_TOKEN;
  if (!bootstrapToken) {
    return NextResponse.json({ error: "School setup is not enabled on this deployment." }, { status: 404 });
  }
  const authorization = req.headers.get("authorization");
  if (authorization !== `Bearer ${bootstrapToken}`) {
    return NextResponse.json({ error: "Invalid setup credentials." }, { status: 401 });
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid setup request." }, { status: 400 });
  const { schoolName, username, displayName, password } = body as Record<string, unknown>;
  if (typeof schoolName !== "string" || schoolName.trim().length < 2 || schoolName.trim().length > 150 ||
      typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
      typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 100 ||
      typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Provide a school name, username, display name, and a 12-128 character password." }, { status: 400 });
  }

  await dbConnect();
  const normalizedUsername = username.trim().toLowerCase();
  if (await User.exists({ username: normalizedUsername })) {
    return NextResponse.json({ error: "Username is already in use." }, { status: 409 });
  }

  const mongoSession = await mongoose.startSession();
  try {
    let result: { schoolId: mongoose.Types.ObjectId; adminId: mongoose.Types.ObjectId } | undefined;
    await mongoSession.withTransaction(async () => {
      if (await User.exists({ role: "SchoolAdmin" }).session(mongoSession)) {
        throw new Error("BOOTSTRAP_ALREADY_COMPLETED");
      }
      await BootstrapClaim.create([{ _id: "initial-school-admin" }], { session: mongoSession });
      const [school] = await School.create([{ name: schoolName.trim() }], { session: mongoSession });
      const [user] = await User.create([{
        username: normalizedUsername,
        displayName: displayName.trim(),
        password: await bcrypt.hash(password, 12),
        role: "SchoolAdmin",
        school: school._id,
        coins: 0,
      }], { session: mongoSession });
      result = { schoolId: school._id, adminId: user._id };
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_ALREADY_COMPLETED") {
      return NextResponse.json({ error: "Initial school setup has already been completed." }, { status: 409 });
    }
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Initial school setup has already been claimed." }, { status: 409 });
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }
}
