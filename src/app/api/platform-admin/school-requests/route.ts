import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import School from "@/models/School";
import SchoolSignupRequest from "@/models/SchoolSignupRequest";
import User from "@/models/User";
import { sendSchoolEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] || char);
}

async function getPlatformAdminId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const allowedUsernames = new Set(
    (process.env.PLATFORM_ADMIN_USERNAMES || "")
      .split(",")
      .map((username) => username.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!userId) return null;

  await dbConnect();
  const user = await User.findById(userId).select("username role").lean();
  if (!user || (user.role !== "PlatformAdmin" &&
      !(user.role === "SchoolAdmin" && allowedUsernames.has(user.username)))) return null;
  return user._id;
}

export async function GET() {
  const platformAdminId = await getPlatformAdminId();
  if (!platformAdminId) {
    return NextResponse.json({ error: "Platform operator access required." }, { status: 403 });
  }

  const requests = await SchoolSignupRequest.find({ status: "Pending" })
    .select("schoolName contactEmail adminUsername adminDisplayName createdAt")
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  return NextResponse.json({ requests });
}

export async function PATCH(req: Request) {
  const platformAdminId = await getPlatformAdminId();
  if (!platformAdminId) {
    return NextResponse.json({ error: "Platform operator access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }
  const { requestId, decision, reviewNote } = body as Record<string, unknown>;
  if (typeof requestId !== "string" || !mongoose.isValidObjectId(requestId) ||
      !["approve", "reject"].includes(String(decision)) ||
      (reviewNote !== undefined && (typeof reviewNote !== "string" || reviewNote.trim().length > 500))) {
    return NextResponse.json({ error: "Provide a valid request, decision, and optional note (up to 500 characters)." }, { status: 400 });
  }

  const mongoSession = await mongoose.startSession();
  try {
    let schoolId: mongoose.Types.ObjectId | undefined;
    let administratorId: mongoose.Types.ObjectId | undefined;
    let contactEmail = "";
    let schoolName = "";
    let adminUsername = "";
    await mongoSession.withTransaction(async () => {
      const request = await SchoolSignupRequest.findOne({
        _id: requestId,
        status: "Pending",
      }).select("+adminPasswordHash").session(mongoSession);
      if (!request) throw new Error("REQUEST_NOT_PENDING");

      contactEmail = request.contactEmail;
      schoolName = request.schoolName;
      adminUsername = request.adminUsername;
      request.status = decision === "approve" ? "Approved" : "Rejected";
      request.reviewedBy = platformAdminId;
      request.reviewedAt = new Date();
      request.reviewNote = typeof reviewNote === "string" ? reviewNote.trim() : undefined;

      if (decision === "approve") {
        if (!request.adminPasswordHash ||
            await User.exists({ username: request.adminUsername }).session(mongoSession)) {
          throw new Error("ADMIN_USERNAME_UNAVAILABLE");
        }
        const [school] = await School.create([{ name: request.schoolName }], { session: mongoSession });
        const [administrator] = await User.create([{
          username: request.adminUsername,
          displayName: request.adminDisplayName,
          email: request.contactEmail,
          password: request.adminPasswordHash,
          role: "SchoolAdmin",
          school: school._id,
          coins: 0,
        }], { session: mongoSession });
        request.school = school._id;
        request.administrator = administrator._id;
        schoolId = school._id;
        administratorId = administrator._id;
      }

      request.adminPasswordHash = undefined;
      await request.save({ session: mongoSession });
    });

    let emailSent = false;
    let emailWarning: string | undefined;
    try {
      const loginUrl = new URL("/login", process.env.NEXTAUTH_URL || req.url).toString();
      emailSent = await sendSchoolEmail({
        to: contactEmail,
        subject: decision === "approve" ? "Your ClassCrib school account is approved" : "Update on your ClassCrib school request",
        html: decision === "approve"
          ? `<p>Your school account for ${escapeHtml(schoolName)} has been approved.</p><p>Administrator username: <strong>${escapeHtml(adminUsername)}</strong></p><p>Sign in using the password you chose during signup: <a href="${loginUrl}">${loginUrl}</a></p>`
          : `<p>Your school account request for ${escapeHtml(schoolName)} was not approved at this time.</p>${typeof reviewNote === "string" && reviewNote.trim() ? `<p>Review note: ${escapeHtml(reviewNote.trim())}</p>` : ""}`,
      });
      if (!emailSent) emailWarning = "Decision saved, but email is not configured. Contact the requester manually.";
    } catch (emailError) {
      console.error("School signup decision email failed:", emailError);
      emailWarning = "Decision saved, but notification email failed. Contact the requester manually.";
    }

    return NextResponse.json({
      success: true,
      decision,
      emailSent,
      ...(emailWarning ? { emailWarning } : {}),
      ...(schoolId ? { schoolId, administratorId } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_NOT_PENDING") {
      return NextResponse.json({ error: "This request was already reviewed or no longer exists." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "ADMIN_USERNAME_UNAVAILABLE") {
      return NextResponse.json({ error: "The requested administrator username is no longer available." }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "The administrator username is already in use." }, { status: 409 });
    }
    console.error("School signup review failed:", error);
    return NextResponse.json({ error: "Unable to process the school signup decision." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
