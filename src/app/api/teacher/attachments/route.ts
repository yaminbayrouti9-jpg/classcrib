import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import Task from "@/models/Task";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);

function validateFile(buffer: Buffer, contentType: string) {
  if (contentType === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (contentType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (contentType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return contentType === "text/plain" && !buffer.includes(0);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.role !== "Teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const rawClassIds = formData.get("classIds");
  if (!(file instanceof File) || typeof rawClassIds !== "string" || file.size < 1 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Choose a file smaller than 4 MB and one or more classes." }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Supported files are PDF, PNG, JPEG, WebP, or plain text." }, { status: 415 });
  }

  let classIds: unknown;
  try {
    classIds = JSON.parse(rawClassIds);
  } catch {
    return NextResponse.json({ error: "Class selection is invalid." }, { status: 400 });
  }
  if (!Array.isArray(classIds) || classIds.length < 1 || classIds.length > 20 ||
      classIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id)) ||
      new Set(classIds).size !== classIds.length) {
    return NextResponse.json({ error: "Select between 1 and 20 valid classes." }, { status: 400 });
  }

  await dbConnect();
  const classes = await Class.find({ _id: { $in: classIds }, teacher: actor.id }).select("_id school");
  if (classes.length !== classIds.length) {
    return NextResponse.json({ error: "Every selected class must be one you teach." }, { status: 403 });
  }
  const schoolIds = [...new Set(classes.map((item) => item.school?.toString() || ""))];
  if (schoolIds.length > 1) {
    return NextResponse.json({ error: "Select classes from the same school." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validateFile(bytes, file.type)) {
    return NextResponse.json({ error: "The file content does not match its supported file type." }, { status: 415 });
  }

  const database = mongoose.connection.db;
  if (!database) throw new Error("Database connection is unavailable.");
  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "assignmentAttachments" });
  const id = new mongoose.Types.ObjectId();
  const safeName = file.name.replace(/[\\/\r\n"]/g, "_").slice(0, 120) || "attachment";
  const upload = bucket.openUploadStream(safeName, {
    id,
    contentType: file.type,
    metadata: {
      uploaderId: actor.id,
      classIds: classIds as string[],
      schoolId: schoolIds[0] || null,
    },
  });
  try {
    await pipeline(Readable.from([bytes]), upload);
  } catch (error) {
    console.error("Assignment attachment upload failed:", error);
    if (upload.id) await bucket.delete(upload.id).catch((cleanupError) => {
      console.error("Could not clean up incomplete assignment attachment:", cleanupError);
    });
    return NextResponse.json({ error: "Attachment upload failed." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    attachment: { name: safeName, url: `/api/attachments/${id.toString()}` },
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.role !== "Teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).id !== "string" ||
      !mongoose.isValidObjectId((body as Record<string, string>).id)) {
    return NextResponse.json({ error: "Valid attachment ID required." }, { status: 400 });
  }

  await dbConnect();
  const id = new mongoose.Types.ObjectId((body as Record<string, string>).id);
  const database = mongoose.connection.db;
  if (!database) throw new Error("Database connection is unavailable.");
  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "assignmentAttachments" });
  const [file] = await bucket.find({ _id: id }).toArray();
  if (!file || file.metadata?.uploaderId !== actor.id) {
    return NextResponse.json({ error: "Attachment not found or access denied." }, { status: 404 });
  }
  if (await Task.exists({ "attachments.url": `/api/attachments/${id.toString()}` })) {
    return NextResponse.json({ error: "An attachment already used by an assignment cannot be deleted here." }, { status: 409 });
  }
  await bucket.delete(id);
  return NextResponse.json({ success: true });
}
