import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Class from "@/models/Class";

type ImportUser = {
  username: string;
  displayName: string;
  password: string;
  role?: "Student" | "Teacher" | "SchoolAdmin";
  schoolYear?: string;
  team?: string;
};

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  fields.push(value.trim());
  return fields;
}

function parseCsv(csv: string): ImportUser[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error("CSV is empty.");
  const header = parseCsvRow(lines[0]).map((field) => field.toLowerCase());
  const required = ["username", "displayname", "password"];
  if (required.some((field) => !header.includes(field))) {
    throw new Error("CSV headers must include username, displayName, and password. Optional headers: role, schoolYear, team.");
  }
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row = Object.fromEntries(header.map((name, index) => [name, values[index] || ""]));
    return {
      username: row.username,
      displayName: row.displayname,
      password: row.password,
      role: row.role === "Teacher" || row.role === "SchoolAdmin" ? row.role : "Student",
      schoolYear: row.schoolyear || undefined,
      team: row.team || undefined,
    };
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });

  await dbConnect();
  const [teachers, classes] = await Promise.all([
    User.find({ school: schoolId, role: { $in: ["Teacher", "SchoolAdmin"] } }).select("_id username displayName role").sort({ username: 1 }).lean(),
    Class.find({ school: schoolId }).populate("teacher", "username displayName").populate("students", "username displayName schoolYear team").sort({ name: 1 }).lean(),
  ]);
  return NextResponse.json({ teachers, classes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });

  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
  let records: ImportUser[];
  try {
    const input = body as { users?: unknown; csv?: unknown };
    if (typeof input.csv === "string") {
      records = parseCsv(input.csv);
    } else if (Array.isArray(input.users)) {
      records = input.users as ImportUser[];
    } else {
      return NextResponse.json({ error: "Provide users or CSV content." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid CSV." }, { status: 400 });
  }

  const { classIds = [] } = body as { classIds?: unknown };
  if (!records.length || records.length > 500 || !Array.isArray(classIds) ||
      classIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
    return NextResponse.json({ error: "Import 1 to 500 users and provide valid class IDs." }, { status: 400 });
  }
  const usernames = records.map((record) => record.username?.trim().toLowerCase());
  if (records.some((record) =>
    typeof record.username !== "string" || record.username.trim().length < 3 || record.username.trim().length > 32 ||
    typeof record.displayName !== "string" || record.displayName.trim().length < 2 || record.displayName.trim().length > 100 ||
    typeof record.password !== "string" || record.password.length < 10 || record.password.length > 128 ||
    (record.role !== undefined && !["Student", "Teacher", "SchoolAdmin"].includes(record.role)) ||
    (record.team !== undefined && (typeof record.team !== "string" || record.team.length > 80)) ||
    (record.schoolYear !== undefined && (typeof record.schoolYear !== "string" || record.schoolYear.length > 40))
  ) || new Set(usernames).size !== usernames.length) {
    return NextResponse.json({ error: "Every row needs a unique valid username, display name, 10-128 character password, and valid role/year/team." }, { status: 400 });
  }

  await dbConnect();
  const classes = classIds.length ? await Class.find({ _id: { $in: classIds }, school: schoolId }).select("_id") : [];
  if (classes.length !== classIds.length) return NextResponse.json({ error: "All selected classes must belong to your school." }, { status: 403 });
  if (records.some((record) => record.role !== "Student") && classIds.length) {
    return NextResponse.json({ error: "Assign students to classes; create classes for teachers separately." }, { status: 400 });
  }
  if (await User.exists({ username: { $in: usernames } })) {
    return NextResponse.json({ error: "At least one username is already in use. No accounts were imported." }, { status: 409 });
  }

  const mongoSession = await mongoose.startSession();
  try {
    let imported: Array<{ _id: mongoose.Types.ObjectId; role: string }> = [];
    await mongoSession.withTransaction(async () => {
      imported = await User.insertMany(await Promise.all(records.map(async (record) => ({
        username: record.username.trim().toLowerCase(),
        displayName: record.displayName.trim(),
        password: await bcrypt.hash(record.password, 12),
        role: record.role || "Student",
        school: schoolId,
        schoolYear: record.schoolYear?.trim(),
        team: record.team?.trim(),
      }))), { session: mongoSession });

      const studentIds = imported.filter((user) => user.role === "Student").map((user) => user._id);
      if (classIds.length && studentIds.length) {
        await Class.updateMany({ _id: { $in: classIds }, school: schoolId }, { $addToSet: { students: { $each: studentIds } } }, { session: mongoSession });
        await User.updateMany({ _id: { $in: studentIds } }, { $addToSet: { workspaces: { $each: classIds } } }, { session: mongoSession });
      }
    });
    return NextResponse.json({ success: true, importedCount: imported.length }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A username was already imported by another request. No partial import was committed." }, { status: 409 });
    }
    console.error("School user import failed:", error);
    return NextResponse.json({ error: "Import failed. No partial user records were committed." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
