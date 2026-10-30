import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import ParentLink from "@/models/ParentLink";
import Task from "@/models/Task";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const actor = session.user as { id: string; role?: string; schoolId?: string };
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid attachment." }, { status: 400 });

  await dbConnect();
  const database = mongoose.connection.db;
  if (!database) throw new Error("Database connection is unavailable.");
  const objectId = new mongoose.Types.ObjectId(id);
  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "assignmentAttachments" });
  const [file] = await bucket.find({ _id: objectId }).toArray();
  if (!file) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });

  const task = await Task.findOne({ "attachments.url": `/api/attachments/${id}` })
    .select("creator class classes workspace assignedStudents")
    .lean();
  if (!task) return NextResponse.json({ error: "Attachment is not linked to an assignment." }, { status: 404 });
  const classIds = [...new Set([
    ...(task.classes || []).map((classId) => classId.toString()),
    ...(task.class ? [task.class.toString()] : []),
    ...(task.workspace ? [task.workspace.toString()] : []),
  ])];
  const restrictedToStudents = Boolean(task.assignedStudents?.length);
  const isAssignedStudent = !restrictedToStudents ||
    task.assignedStudents?.some((studentId) => studentId.toString() === actor.id);
  let authorized = false;

  if (actor.role === "Teacher") {
    authorized = task.creator.toString() === actor.id;
  } else if (actor.role === "SchoolAdmin") {
    authorized = Boolean(actor.schoolId && await Class.exists({ _id: { $in: classIds }, school: actor.schoolId }));
  } else if (actor.role === "Student" && isAssignedStudent) {
    authorized = Boolean(await Class.exists({ _id: { $in: classIds }, students: actor.id }));
  } else if (actor.role === "Parent") {
    const links = await ParentLink.find({ parent: actor.id }).select("student").lean();
    const linkedStudentIds = links.map((link) => link.student.toString());
    const eligibleStudentIds = restrictedToStudents
      ? linkedStudentIds.filter((studentId) => task.assignedStudents?.some((assignedId) => assignedId.toString() === studentId))
      : linkedStudentIds;
    authorized = eligibleStudentIds.length > 0 &&
      Boolean(await Class.exists({ _id: { $in: classIds }, students: { $in: eligibleStudentIds } }));
  }
  if (!authorized) return NextResponse.json({ error: "Attachment access denied." }, { status: 403 });

  const chunks: Buffer[] = [];
  for await (const chunk of bucket.openDownloadStream(objectId)) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const content = Buffer.concat(chunks);
  const safeName = file.filename.replace(/[^\x20-\x7e]/g, "_").replace(/[\r\n"\\]/g, "_").slice(0, 120) || "assignment-attachment";
  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Content-Length": content.length.toString(),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
