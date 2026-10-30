import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ChatReport from "@/models/ChatReport";
import Class from "@/models/Class";
import Notification from "@/models/Notification";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthorizedClass(id: string, user: { id: string; role?: string; schoolId?: string }) {
  const classQuery = user.role === "Teacher"
    ? { _id: id, teacher: user.id }
    : user.role === "SchoolAdmin"
      ? { _id: id, school: user.schoolId }
      : null;
  return classQuery ? Class.findOne(classQuery).select("_id posts") : null;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = session.user as { id: string; role?: string; schoolId?: string };
  if (!["Teacher", "SchoolAdmin"].includes(user.role || "")) return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid class." }, { status: 400 });
  await dbConnect();
  const targetClass = await getAuthorizedClass(id, user);
  if (!targetClass) return NextResponse.json({ error: "Class not found or access denied." }, { status: 404 });
  const reports = await ChatReport.find({ classId: id })
    .populate("reporter", "username displayName")
    .sort({ createdAt: -1 })
    .lean();
  const reportItems = reports as unknown as Array<{
    postId: mongoose.Types.ObjectId;
    reporter: { username?: string; displayName?: string };
    [key: string]: unknown;
  }>;
  const classPosts = targetClass.posts as Array<{ _id: mongoose.Types.ObjectId; authorName?: string; content: string }>;
  const postsById = new Map(classPosts.map((post) => [post._id.toString(), post]));
  return NextResponse.json({
    reports: reportItems.map((report) => ({
      ...report,
      post: postsById.get(report.postId.toString()) || null,
    })),
  });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = session.user as { id: string; role?: string; schoolId?: string };
  if (!["Teacher", "SchoolAdmin"].includes(user.role || "")) return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid class." }, { status: 400 });
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  const { reportId, status, resolution } = body as Record<string, unknown>;
  if (typeof reportId !== "string" || !mongoose.isValidObjectId(reportId) ||
      !["Reviewed", "Dismissed"].includes(String(status)) ||
      (resolution !== undefined && (typeof resolution !== "string" || resolution.length > 500))) {
    return NextResponse.json({ error: "Provide a valid report status and optional review note." }, { status: 400 });
  }
  await dbConnect();
  const targetClass = await getAuthorizedClass(id, user);
  if (!targetClass) return NextResponse.json({ error: "Class not found or access denied." }, { status: 404 });
  const mongoSession = await mongoose.startSession();
  let reportNotOpen = false;
  try {
    await mongoSession.withTransaction(async () => {
      const report = await ChatReport.findOneAndUpdate(
        { _id: reportId, classId: id, status: "Open" },
        { $set: { status, resolution: typeof resolution === "string" ? resolution.trim() : "", reviewedBy: user.id, reviewedAt: new Date() } },
        { new: true, session: mongoSession },
      );
      if (!report) {
        reportNotOpen = true;
        return;
      }
      await Notification.create([{
        recipient: report.reporter,
        sender: user.id,
        type: "System",
        title: "Chat report reviewed",
        message: status === "Reviewed" ? "A teacher reviewed your chat report." : "A teacher reviewed and dismissed your chat report.",
        link: `/classes/${id}`,
      }], { session: mongoSession });
    });
  } catch (error) {
    console.error("Chat report review failed:", error);
    return NextResponse.json({ error: "Unable to save report review." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
  if (reportNotOpen) return NextResponse.json({ error: "Report is no longer open." }, { status: 409 });
  return NextResponse.json({ success: true });
}
