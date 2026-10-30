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
  role?: "Student" | "Teacher";
  schoolYear?: string;
  team?: string;
};

function parseCsv(csv: string): ImportUser[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let afterQuote = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        value += char;
      }
    } else if (char === '"') {
      if (value.length !== 0 || afterQuote) {
        throw new Error("CSV contains a quote inside an unquoted field.");
      }
      quoted = true;
    } else if (char === "," || char === "\n" || char === "\r") {
      row.push(value.trim());
      value = "";
      afterQuote = false;
      if (char !== ",") {
        if (row.some((field) => field.length > 0)) rows.push(row);
        row = [];
        if (char === "\r" && csv[index + 1] === "\n") index++;
      }
    } else if (afterQuote && !/\s/.test(char)) {
      throw new Error("CSV contains unexpected characters after a quoted field.");
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (value.length || row.length) {
    row.push(value.trim());
    if (row.some((field) => field.length > 0)) rows.push(row);
  }
  if (!rows.length) throw new Error("CSV is empty.");

  const header = rows[0].map((field, index) =>
    (index === 0 ? field.replace(/^\uFEFF/, "") : field).trim().toLowerCase(),
  );
  if (header.some((field) => !field) || new Set(header).size !== header.length) {
    throw new Error("CSV headers must be non-empty and unique.");
  }
  const supported = new Set(["username", "displayname", "password", "role", "schoolyear", "team"]);
  if (header.some((field) => !supported.has(field))) {
    throw new Error("CSV contains an unsupported column.");
  }
  const required = ["username", "displayname", "password"];
  if (required.some((field) => !header.includes(field))) {
    throw new Error("CSV headers must include username, displayName, and password. Optional headers: role, schoolYear, team.");
  }
  if (rows.length === 1) throw new Error("CSV must include at least one account row.");
  return rows.slice(1).map((values, index) => {
    if (values.length !== header.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${header.length}.`);
    }
    const row = Object.fromEntries(header.map((name, index) => [name, values[index] || ""]));
    if (row.role && !["student", "teacher"].includes(row.role.toLowerCase())) {
      throw new Error(`CSV row ${index + 2} has an unsupported role. Only Student and Teacher accounts can be imported.`);
    }
    return {
      username: row.username,
      displayName: row.displayname,
      password: row.password,
      role: row.role ? row.role[0].toUpperCase() + row.role.slice(1).toLowerCase() as "Student" | "Teacher" : "Student",
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
    User.find({ school: schoolId, role: "Teacher" }).select("_id username displayName role").sort({ username: 1 }).lean(),
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
  let records: ImportUser[];
  let teacherOnly = false;
  try {
    const input = body as { users?: unknown; csv?: unknown; teacherOnly?: unknown };
    if (input.teacherOnly !== undefined && typeof input.teacherOnly !== "boolean") {
      return NextResponse.json({ error: "teacherOnly must be true or false." }, { status: 400 });
    }
    teacherOnly = input.teacherOnly === true;
    if (typeof input.csv === "string") {
      if (input.csv.length > 250_000) {
        return NextResponse.json({ error: "CSV file is too large. Maximum size is 250 KB." }, { status: 413 });
      }
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
  if (teacherOnly) records = records.map((record) => ({ ...record, role: "Teacher" }));
  if (!records.length || records.length > 500 || !Array.isArray(classIds) ||
      classIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
    return NextResponse.json({ error: "Import 1 to 500 users and provide valid class IDs." }, { status: 400 });
  }
  if (records.some((record) =>
    !record || typeof record !== "object" ||
    typeof record.username !== "string" || record.username.trim().length < 3 || record.username.trim().length > 32 ||
    !/^[a-zA-Z0-9._-]+$/.test(record.username.trim()) ||
    typeof record.displayName !== "string" || record.displayName.trim().length < 2 || record.displayName.trim().length > 100 ||
    typeof record.password !== "string" || record.password.length < 10 || record.password.length > 128 ||
    (record.role !== undefined && !["Student", "Teacher"].includes(record.role)) ||
    (record.team !== undefined && (typeof record.team !== "string" || record.team.length > 80)) ||
    (record.schoolYear !== undefined && (typeof record.schoolYear !== "string" || record.schoolYear.length > 40))
  )) {
    return NextResponse.json({ error: "Every row needs a valid username (letters, numbers, . _ -), display name, 10-128 character password, and valid role/year/team." }, { status: 400 });
  }
  const usernames = records.map((record) => record.username.trim().toLowerCase());
  if (new Set(usernames).size !== usernames.length) {
    return NextResponse.json({ error: "The import contains duplicate usernames. No accounts were imported." }, { status: 400 });
  }

  await dbConnect();
  const classes = classIds.length ? await Class.find({ _id: { $in: classIds }, school: schoolId }).select("_id") : [];
  if (classes.length !== classIds.length) return NextResponse.json({ error: "All selected classes must belong to your school." }, { status: 403 });
  if ((teacherOnly || records.some((record) => record.role !== "Student")) && classIds.length) {
    return NextResponse.json({ error: "Assign students to classes; create classes for teachers separately." }, { status: 400 });
  }
  const duplicateUsers = await User.find({ username: { $in: usernames } }).select("username").lean();
  if (duplicateUsers.length) {
    const duplicateNames = duplicateUsers.map((user) => user.username);
    return NextResponse.json({
      error: `These usernames are already in use: ${duplicateNames.join(", ")}. No accounts were imported.`,
      duplicateUsernames: duplicateNames,
    }, { status: 409 });
  }

  const preparedRecords = await Promise.all(records.map(async (record) => ({
    username: record.username.trim().toLowerCase(),
    displayName: record.displayName.trim(),
    password: await bcrypt.hash(record.password, 12),
    role: record.role || "Student",
    school: schoolId,
    schoolYear: record.schoolYear?.trim(),
    team: record.team?.trim(),
  })));
  const mongoSession = await mongoose.startSession();
  try {
    let imported: Array<{ _id: mongoose.Types.ObjectId; role: string }> = [];
    await mongoSession.withTransaction(async () => {
      imported = await User.insertMany(preparedRecords, { session: mongoSession });

      const studentIds = imported.filter((user) => user.role === "Student").map((user) => user._id);
      if (classIds.length && studentIds.length) {
        await Class.updateMany({ _id: { $in: classIds }, school: schoolId }, { $addToSet: { students: { $each: studentIds } } }, { session: mongoSession });
        await User.updateMany({ _id: { $in: studentIds } }, { $addToSet: { workspaces: { $each: classIds } } }, { session: mongoSession });
      }
    });
    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      importedUsernames: preparedRecords.map((record) => record.username),
    }, { status: 201 });
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
