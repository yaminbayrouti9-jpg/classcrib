import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { openai } from "@/lib/openai";
import Class from "@/models/Class";
import School from "@/models/School";
import Task from "@/models/Task";
import Submission from "@/models/Submission";

const taskTypes = ["Homework", "Green", "Physical", "Activity"] as const;
type TaskType = typeof taskTypes[number];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "Teacher") {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }
  const teacherId = (session.user as { id: string }).id;
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid AI request." }, { status: 400 });
  const { mode, classId, prompt, taskType } = body as Record<string, unknown>;
  if (!["draft", "rewards", "summary"].includes(String(mode)) ||
      typeof classId !== "string" || !mongoose.isValidObjectId(classId) ||
      (prompt !== undefined && (typeof prompt !== "string" || prompt.trim().length > 4000)) ||
      (taskType !== undefined && !taskTypes.includes(taskType as TaskType))) {
    return NextResponse.json({ error: "Choose an AI tool, class, and valid task description." }, { status: 400 });
  }
  await dbConnect();
  const targetClass = await Class.findOne({ _id: classId, teacher: teacherId }).select("_id school students name");
  if (!targetClass) return NextResponse.json({ error: "Class not found." }, { status: 403 });
  const school = targetClass.school ? await School.findById(targetClass.school).select("settings.rewardsByTaskType") : null;

  if (mode === "summary") {
    const tasks = await Task.find({ $or: [{ class: classId }, { classes: classId }] }).select("_id title dueDate");
    const taskIds = tasks.map((task) => task._id);
    const [approved, pending, rejected] = await Promise.all([
      Submission.countDocuments({ task: { $in: taskIds }, status: "Approved" }),
      Submission.countDocuments({ task: { $in: taskIds }, status: "Pending" }),
      Submission.countDocuments({ task: { $in: taskIds }, status: "Rejected" }),
    ]);
    const overdue = tasks.filter((task) => task.dueDate < new Date()).length;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Summarize classroom progress for a teacher in concise, supportive language. Use only provided aggregate counts. Do not invent causes, names, or student-level conclusions." },
        { role: "user", content: JSON.stringify({ className: targetClass.name, students: targetClass.students.length, assignments: tasks.length, approved, pending, rejected, overdue }) },
      ],
      max_tokens: 250,
    });
    return NextResponse.json({ summary: response.choices[0].message.content, metrics: { students: targetClass.students.length, assignments: tasks.length, approved, pending, rejected, overdue } });
  }

  const requestedType = (taskType as TaskType) || "Homework";
  const taskTypeKey = requestedType.toLowerCase() as "homework" | "green" | "physical" | "activity";
  const rules = school?.settings.rewardsByTaskType?.[taskTypeKey] || {
    coinsPerAward: 500,
    xpPerAward: 1000,
  };
  const teacherPrompt = typeof prompt === "string" ? prompt.trim() : "";
  if (teacherPrompt.length < 5) return NextResponse.json({ error: "Describe the assignment or its learning goal." }, { status: 400 });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: mode === "draft"
          ? `Return JSON with title, instructions, type, suggestedCoins, suggestedXp. Write a clear age-appropriate school assignment based on the teacher's request. type must be one of ${taskTypes.join(", ")}. Suggested awards are proposals only and must be integers within ${rules.coinsPerAward} coins and ${rules.xpPerAward} XP.`
          : `Return JSON with suggestedCoins, suggestedXp, rationale. Suggest a sensible reward for the teacher's described task; never decide or award it. Values must be integers between 0 and ${rules.coinsPerAward} coins, and 0 and ${rules.xpPerAward} XP.`,
      },
      { role: "user", content: `Task type: ${requestedType}\nTeacher request: ${teacherPrompt}` },
    ],
    max_tokens: 500,
  });
  const content = response.choices[0].message.content;
  if (!content) return NextResponse.json({ error: "AI did not return a suggestion. Please try again." }, { status: 502 });
  try {
    const result = JSON.parse(content) as Record<string, unknown>;
    const suggestedCoins = Number(result.suggestedCoins);
    const suggestedXp = Number(result.suggestedXp);
    if (!Number.isSafeInteger(suggestedCoins) || suggestedCoins < 0 || suggestedCoins > rules.coinsPerAward ||
        !Number.isSafeInteger(suggestedXp) || suggestedXp < 0 || suggestedXp > rules.xpPerAward) {
      return NextResponse.json({ error: "AI returned a reward outside the school limits; no suggestion was applied." }, { status: 502 });
    }
    return NextResponse.json({ suggestion: result, limits: rules, taskType: requestedType });
  } catch {
    return NextResponse.json({ error: "AI returned an invalid suggestion. Please try again." }, { status: 502 });
  }
}
