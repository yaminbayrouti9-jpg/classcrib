import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import SchoolSignupRequest from "@/models/SchoolSignupRequest";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid school signup request." }, { status: 400 });
  }

  const { schoolName, contactEmail, username, displayName, password } = body as Record<string, unknown>;
  if (typeof schoolName !== "string" || schoolName.trim().length < 2 || schoolName.trim().length > 150 ||
      typeof contactEmail !== "string" || contactEmail.length > 254 || !isValidEmail(contactEmail.trim()) ||
      typeof username !== "string" || username.trim().length < 3 || username.trim().length > 32 ||
      !/^[a-zA-Z0-9._-]+$/.test(username.trim()) ||
      typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 100 ||
      typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({
      error: "Enter a school name, contact email, valid username, display name, and a 12-128 character password.",
    }, { status: 400 });
  }

  await dbConnect();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = contactEmail.trim().toLowerCase();
  if (await User.exists({ username: normalizedUsername })) {
    return NextResponse.json({ error: "That administrator username is already in use." }, { status: 409 });
  }
  if (await SchoolSignupRequest.exists({
    status: "Pending",
    $or: [{ adminUsername: normalizedUsername }, { contactEmail: normalizedEmail }],
  })) {
    return NextResponse.json({ error: "A pending school request already uses that username or contact email." }, { status: 409 });
  }

  try {
    await SchoolSignupRequest.create({
      schoolName: schoolName.trim(),
      contactEmail: normalizedEmail,
      adminUsername: normalizedUsername,
      adminDisplayName: displayName.trim(),
      adminPasswordHash: await bcrypt.hash(password, 12),
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A pending school request already uses that username or contact email." }, { status: 409 });
    }
    console.error("School signup request failed:", error);
    return NextResponse.json({ error: "Unable to submit the school request." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Your school request is submitted for ClassCrib review. We will contact you at the email provided.",
  }, { status: 201 });
}
