import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BehaviorPoint from "@/models/BehaviorPoint";
import Class from "@/models/Class";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const actor = session.user as { id: string; role?: string; schoolId?: string };
  const classId = new URL(req.url).searchParams.get("classId");
  if (actor.role === "SchoolAdmin" && !actor.schoolId) {
    return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });
  }
  if (!["Teacher", "SchoolAdmin"].includes(actor.role || "")) {
    return NextResponse.json({ error: "Teacher or school administrator access required." }, { status: 403 });
  }

  await dbConnect();
  if (actor.role === "Teacher" && (!classId || !mongoose.isValidObjectId(classId) || !(await Class.exists({ _id: classId, teacher: actor.id })))) {
    return NextResponse.json({ error: "Select a class you teach." }, { status: 403 });
  }
  const schoolClass = classId ? await Class.findById(classId).select("school name") : null;
  if (classId && actor.role === "SchoolAdmin" && schoolClass?.school?.toString() !== actor.schoolId) {
    return NextResponse.json({ error: "Class is outside your school." }, { status: 403 });
  }
  const match = actor.role === "SchoolAdmin"
    ? { school: actor.schoolId, status: "Approved", reversedAt: null }
    : { class: classId, status: "Approved", reversedAt: null };
  const [groupedRecords, records] = await Promise.all([
    BehaviorPoint.aggregate([
      { $match: match },
      { $group: { _id: { student: "$student", class: "$class" }, points: { $sum: "$points" } } },
    ]),
    BehaviorPoint.find(match)
    .populate("student", "username displayName team schoolYear")
    .populate("class", "name")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean(),
  ]);
  const studentIds = [...new Set(groupedRecords.map((record) => record._id.student.toString()))];
  const classIds = [...new Set(groupedRecords.map((record) => record._id.class.toString()))];
  const [studentRecords, classRecords] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select("username displayName team schoolYear").lean(),
    Class.find({ _id: { $in: classIds } }).select("name").lean(),
  ]);
  const studentById = new Map(studentRecords.map((student) => [student._id.toString(), student]));
  const classById = new Map(classRecords.map((classDoc) => [classDoc._id.toString(), classDoc.name]));
  const studentTotals = new Map<string, number>();
  const classTotals = new Map<string, number>();
  for (const record of groupedRecords) {
    const studentId = record._id.student.toString();
    const classKey = record._id.class.toString();
    studentTotals.set(studentId, (studentTotals.get(studentId) || 0) + record.points);
    classTotals.set(classKey, (classTotals.get(classKey) || 0) + record.points);
  }
  const students = studentIds.map((studentId) => {
    const student = studentById.get(studentId);
    return {
      studentId,
      studentName: student?.displayName || student?.username || "Student",
      team: student?.team || "Unassigned",
      schoolYear: student?.schoolYear || "Unassigned",
      points: studentTotals.get(studentId) || 0,
    };
  }).sort((a, b) => b.points - a.points);
  const totalsByStudentAttribute = (key: "team" | "schoolYear") => {
    const result = new Map<string, number>();
    for (const student of students) result.set(student[key], (result.get(student[key]) || 0) + student.points);
    return [...result.entries()].map(([name, points]) => ({ name, points })).sort((a, b) => b.points - a.points);
  };
  return NextResponse.json({
    students,
    totals: {
      class: [...classTotals.entries()].map(([classId, points]) => ({ name: classById.get(classId) || "Class", points })).sort((a, b) => b.points - a.points),
      team: totalsByStudentAttribute("team"),
      year: totalsByStudentAttribute("schoolYear"),
      school: students.reduce((sum, student) => sum + student.points, 0),
    },
    records,
  });
}
