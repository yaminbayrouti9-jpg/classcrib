import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import School from "@/models/School";

const SCHOOL_SETTINGS = new Set([
  "allowUsernameSearch",
  "allowCoinGifts",
  "allowClassChat",
  "allowTradingTerminal",
  "allowCribbyAI",
  "allowLeaderboards",
  "leaderboardScope",
  "coinGiftPerTransferCap",
  "coinGiftPerDayCap",
  "rewardsByTaskType",
  "behavior",
  "teams",
  "parentWeeklyEmailEnabled",
]);

const REWARD_RULE_FIELDS = [
  "coinsPerAward",
  "xpPerAward",
  "coinsPerStudentPerDay",
  "xpPerStudentPerDay",
] as const;

function isValidRewardRules(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rules = value as Record<string, unknown>;
  const types = ["homework", "green", "physical", "activity"];
  return Object.keys(rules).length === types.length && types.every((type) => {
    const rule = rules[type];
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) return false;
    const values = rule as Record<string, unknown>;
    return Object.keys(values).every((key) => REWARD_RULE_FIELDS.includes(key as typeof REWARD_RULE_FIELDS[number])) &&
      REWARD_RULE_FIELDS.every((key) =>
        Number.isSafeInteger(values[key]) && Number(values[key]) >= 0 && Number(values[key]) <= 100_000
      );
  });
}

function isValidBehaviorRules(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rules = value as Record<string, unknown>;
  const allowed = new Set([
    "categories",
    "maxPointsPerEntry",
    "pointsPerStudentPerDay",
    "dailyCoinDeductionCap",
    "coinsPerNegativePoint",
    "coinsPerPositivePoint",
    "adminApprovalAboveCap",
  ]);
  if (Object.keys(rules).some((key) => !allowed.has(key))) return false;
  for (const key of ["maxPointsPerEntry", "pointsPerStudentPerDay", "dailyCoinDeductionCap", "coinsPerNegativePoint", "coinsPerPositivePoint"]) {
    const number = rules[key];
    if (!Number.isSafeInteger(number) || Number(number) < 0 || Number(number) > 100_000) return false;
  }
  if (Number(rules.maxPointsPerEntry) < 1 || Number(rules.pointsPerStudentPerDay) < 1) return false;
  if (typeof rules.adminApprovalAboveCap !== "boolean") return false;
  if (!Array.isArray(rules.categories) || rules.categories.length < 1 || rules.categories.length > 50) return false;
  const names = new Set<string>();
  return rules.categories.every((category) => {
    if (!category || typeof category !== "object" || Array.isArray(category)) return false;
    const item = category as Record<string, unknown>;
    if (typeof item.name !== "string" || item.name.trim().length < 1 || item.name.trim().length > 80 ||
        !Number.isSafeInteger(item.defaultPoints) || Number(item.defaultPoints) < -100 || Number(item.defaultPoints) > 100) return false;
    const name = item.name.trim().toLowerCase();
    if (names.has(name)) return false;
    names.add(name);
    return true;
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string; schoolId?: string };
  if (!user.schoolId || !["Teacher", "SchoolAdmin"].includes(user.role || "")) {
    return NextResponse.json({ error: "School access is unavailable for this account." }, { status: 403 });
  }

  await dbConnect();
  const school = await School.findById(user.schoolId).lean();
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });
  return NextResponse.json({ school, canManage: user.role === "SchoolAdmin" });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "Only school administrators can change school settings." }, { status: 403 });
  }
  const { schoolId } = session.user as { schoolId?: string };
  if (!schoolId) return NextResponse.json({ error: "School access is unavailable." }, { status: 403 });

  const body: unknown = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Settings must be an object." }, { status: 400 });
  }
  const settings = (body as { settings?: unknown }).settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return NextResponse.json({ error: "Settings must be an object." }, { status: 400 });
  }
  const entries = Object.entries(settings);
  if (!entries.length || entries.some(([key]) => !SCHOOL_SETTINGS.has(key))) {
    return NextResponse.json({ error: "One or more school settings are not editable." }, { status: 400 });
  }

  await dbConnect();
  const school = await School.findById(schoolId);
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });
  for (const [key, value] of entries) {
    if (key === "leaderboardScope" && !["class", "year", "school"].includes(String(value))) {
      return NextResponse.json({ error: "Invalid leaderboard scope." }, { status: 400 });
    }
    if (key.startsWith("allow") || key === "parentWeeklyEmailEnabled") {
      if (typeof value !== "boolean") return NextResponse.json({ error: `${key} must be a boolean.` }, { status: 400 });
    }
    if (["coinGiftPerTransferCap", "coinGiftPerDayCap"].includes(key) &&
      (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 100_000)) {
      return NextResponse.json({ error: `${key} must be a positive whole number up to 100,000.` }, { status: 400 });
    }
    if (key === "teams" && (!Array.isArray(value) || value.length > 50 ||
      value.some((team) => typeof team !== "string" || team.trim().length < 1 || team.trim().length > 80))) {
      return NextResponse.json({ error: "Teams must be a list of up to 50 names." }, { status: 400 });
    }
    if (key === "behavior" && !isValidBehaviorRules(value)) {
      return NextResponse.json({ error: "Behavior rules must be an object." }, { status: 400 });
    }
    if (key === "rewardsByTaskType" && !isValidRewardRules(value)) {
      return NextResponse.json({ error: "Reward rules must be an object." }, { status: 400 });
    }
    school.set(`settings.${key}`, value);
  }
  await school.save();
  return NextResponse.json({ settings: school.settings });
}
