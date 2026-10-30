import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import BootstrapClaim from "@/models/BootstrapClaim";
import User from "@/models/User";

function isValidSetupToken(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(req: Request) {
  const setupToken = process.env.PLATFORM_OPERATOR_SETUP_TOKEN;
  if (!setupToken) {
    return NextResponse.json({ error: "Operator setup is not enabled." }, { status: 404 });
  }
  if (!isValidSetupToken(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null, setupToken)) {
    return NextResponse.json({ error: "Invalid operator setup token." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid operator setup request." }, { status: 400 });
  }
  const { username, displayName, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
      !/^[a-zA-Z0-9._-]+$/.test(username.trim()) ||
      typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 100 ||
      typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({
      error: "Provide a valid username, display name, and a 12-128 character password.",
    }, { status: 400 });
  }

  await dbConnect();
  const normalizedUsername = username.trim().toLowerCase();
  if (await User.exists({ username: normalizedUsername })) {
    return NextResponse.json({ error: "That username is already in use." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const mongoSession = await mongoose.startSession();
  try {
    let operatorId: mongoose.Types.ObjectId | undefined;
    await mongoSession.withTransaction(async () => {
      if (await BootstrapClaim.exists({ _id: "initial-platform-operator" }).session(mongoSession) ||
          await User.exists({ role: "PlatformAdmin" }).session(mongoSession)) {
        throw new Error("OPERATOR_SETUP_ALREADY_COMPLETED");
      }

      await BootstrapClaim.create([{ _id: "initial-platform-operator" }], { session: mongoSession });
      const [operator] = await User.create([{
        username: normalizedUsername,
        displayName: displayName.trim(),
        password: passwordHash,
        role: "PlatformAdmin",
        coins: 0,
      }], { session: mongoSession });
      operatorId = operator._id;
    });

    return NextResponse.json({ success: true, operatorId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "OPERATOR_SETUP_ALREADY_COMPLETED") {
      return NextResponse.json({ error: "Initial operator setup has already been completed." }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "Operator setup has already been claimed or the username is in use." }, { status: 409 });
    }
    console.error("Platform operator setup failed:", error);
    return NextResponse.json({ error: "Unable to create the platform operator account." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
