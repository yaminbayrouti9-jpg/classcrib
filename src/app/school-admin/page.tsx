"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload, Users, BookOpen, Activity, Clock } from "lucide-react";

type Settings = {
  allowUsernameSearch: boolean;
  allowCoinGifts: boolean;
  allowClassChat: boolean;
  allowTradingTerminal: boolean;
  allowCribbyAI: boolean;
  allowLeaderboards: boolean;
  leaderboardScope: "class" | "year" | "school";
  parentWeeklyEmailEnabled: boolean;
};

type TaskTypeKey = "homework" | "green" | "physical" | "activity";
type RewardRuleKey = "coinsPerAward" | "xpPerAward" | "coinsPerStudentPerDay" | "xpPerStudentPerDay";
type BehaviorRuleKey = "maxPointsPerEntry" | "pointsPerStudentPerDay" | "dailyCoinDeductionCap" | "coinsPerNegativePoint" | "coinsPerPositivePoint";

interface RewardRule {
  coinsPerAward: number;
  xpPerAward: number;
  coinsPerStudentPerDay: number;
  xpPerStudentPerDay: number;
}

type RewardRules = Record<TaskTypeKey, RewardRule>;

interface BehaviorCategory {
  name: string;
  defaultPoints: number;
}

interface BehaviorRules {
  categories: BehaviorCategory[];
  maxPointsPerEntry: number;
  pointsPerStudentPerDay: number;
  dailyCoinDeductionCap: number;
  coinsPerNegativePoint: number;
  coinsPerPositivePoint: number;
  adminApprovalAboveCap: boolean;
}

interface AdminSchool {
  name: string;
  settings: Settings & {
    teams: string[];
    rewardsByTaskType: RewardRules;
    behavior: BehaviorRules;
  };
}

interface AdminUser {
  _id: string;
  username: string;
  displayName?: string;
}

interface AdminClass {
  _id: string;
  name: string;
}

interface SchoolReport {
  studentCount: number;
  teacherCount: number;
  classCount: number;
  completionRate: number | null;
  engagementRate: number | null;
  overdueCount: number;
  activityPulse: Array<{ date: string; submissions: number }>;
  engagementHasComparison: boolean;
  engagementChange: number;
  hallOfFame: Array<{ studentName: string; xp: number }>;
  taskCount: number;
  approvedCount: number;
  pendingCount: number;
}

interface BehaviorReport {
  totals: {
    school: number;
    team: Array<{ name: string; points: number }>;
    year: Array<{ name: string; points: number }>;
    class: Array<{ name: string; points: number }>;
  };
}

interface PendingBehavior {
  _id: string;
  points: number;
  category: string;
  reason: string;
  student?: AdminUser;
  class?: { name: string };
  teacher?: AdminUser;
}

interface PendingReward {
  _id: string;
  coins: number;
  xp: number;
  students?: AdminUser[];
  reason: string;
  taskType: string;
  class?: { name: string };
  teacher?: AdminUser;
}

interface RewardHistoryEntry {
  _id: string;
  amount: number;
  xpAmount?: number;
  reason?: string;
  description?: string;
  createdAt: string;
  user?: AdminUser;
  awardedBy?: AdminUser;
}

const SWITCHES: Array<[keyof Settings, string]> = [
  ["allowUsernameSearch", "Student username search"],
  ["allowCoinGifts", "Coin gifting"],
  ["allowClassChat", "Class chat"],
  ["allowTradingTerminal", "Trading terminal"],
  ["allowCribbyAI", "Cribby AI"],
  ["allowLeaderboards", "Leaderboards"],
  ["parentWeeklyEmailEnabled", "Weekly parent email"],
];

const REWARD_FIELDS: Array<[RewardRuleKey, string]> = [
  ["coinsPerAward", "Coins / award"],
  ["xpPerAward", "XP / award"],
  ["coinsPerStudentPerDay", "Coins / student / day"],
  ["xpPerStudentPerDay", "XP / student / day"],
];

const BEHAVIOR_FIELDS: Array<[BehaviorRuleKey, string]> = [
  ["maxPointsPerEntry", "Points per entry"],
  ["pointsPerStudentPerDay", "Points per student / day"],
  ["dailyCoinDeductionCap", "Coin deduction / day"],
  ["coinsPerNegativePoint", "Coins deducted / negative point"],
  ["coinsPerPositivePoint", "Bonus coins / positive point"],
];

export default function SchoolAdminPage() {
  const [school, setSchool] = useState<AdminSchool | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rewardRules, setRewardRules] = useState<RewardRules | null>(null);
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRules | null>(null);
  const [teams, setTeams] = useState("");
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [report, setReport] = useState<SchoolReport | null>(null);
  const [behaviorReport, setBehaviorReport] = useState<BehaviorReport | null>(null);
  const [pending, setPending] = useState<PendingBehavior[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryEntry[]>([]);
  const [hasMoreRewardHistory, setHasMoreRewardHistory] = useState(false);
  const [loadingRewardHistory, setLoadingRewardHistory] = useState(false);
  const [csv, setCsv] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [className, setClassName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [classYear, setClassYear] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [schoolResponse, usersResponse, reportResponse, behaviorResponse, rewardsResponse, behaviorReportResponse] = await Promise.all([
      fetch("/api/school"),
      fetch("/api/school/users"),
      fetch("/api/school/reports"),
      fetch("/api/school/behavior"),
      fetch("/api/school/rewards"),
      fetch("/api/behavior/report"),
    ]);
    const [schoolData, userData, reportData, behaviorData, rewardsData, behaviorReportData] = await Promise.all([
      schoolResponse.json(), usersResponse.json(), reportResponse.json(), behaviorResponse.json(), rewardsResponse.json(), behaviorReportResponse.json(),
    ]);
    if (!schoolResponse.ok) throw new Error(schoolData.error || "Unable to load school settings.");
    if (!userData.error) {
      setTeachers(userData.teachers || []);
      setClasses(userData.classes || []);
    }
    if (!reportData.error) setReport(reportData.summary);
    if (!behaviorData.error) setPending(behaviorData.pending || []);
    if (!rewardsData.error) setPendingRewards(rewardsData.requests || []);
    if (!rewardsData.error) {
      setRewardHistory(rewardsData.history || []);
      setHasMoreRewardHistory(rewardsData.hasMoreHistory === true);
    }
    if (behaviorReportResponse.ok) setBehaviorReport(behaviorReportData);
    setSchool(schoolData.school);
    setSettings(schoolData.school.settings);
    setRewardRules(schoolData.school.settings.rewardsByTaskType);
    setBehaviorRules(schoolData.school.settings.behavior);
    setTeams((schoolData.school.settings.teams || []).join(", "));
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  const loadOlderRewardHistory = async () => {
    const cursor = rewardHistory[rewardHistory.length - 1]?._id;
    if (!cursor || loadingRewardHistory) return;
    setLoadingRewardHistory(true);
    try {
      const response = await fetch(`/api/school/rewards?before=${encodeURIComponent(cursor)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load older rewards.");
      setRewardHistory((previous) => [...previous, ...(data.history || [])]);
      setHasMoreRewardHistory(data.hasMoreHistory === true);
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : "Unable to load older rewards.");
    } finally {
      setLoadingRewardHistory(false);
    }
  };

  const saveSetting = async (key: keyof Settings, value: unknown) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { [key]: value } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save settings.");
      setSettings((current) => current ? { ...current, [key]: value } : current);
      setMessage("School setting saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  };

  const importUsers = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/school/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, classIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed.");
      setMessage(`Imported ${data.importedCount} accounts.`);
      setCsv("");
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  const createClass = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className, teacherId: classTeacherId, yearGroup: classYear }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create class.");
      setClassName("");
      setClassTeacherId("");
      setClassYear("");
      setMessage("Class created.");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create class.");
    } finally {
      setBusy(false);
    }
  };

  const saveComplexSetting = async (key: string, value: unknown) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { [key]: value } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save school rules.");
      setMessage("School rules saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save school rules.");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (recordId: string, decision: "approve" | "reject") => {
    setBusy(true);
    try {
      const response = await fetch("/api/school/behavior", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update approval.");
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to update approval.");
    } finally {
      setBusy(false);
    }
  };

  const decideReward = async (requestId: string, decision: "approve" | "reject") => {
    setBusy(true);
    try {
      const response = await fetch("/api/school/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update reward approval.");
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to update reward approval.");
    } finally {
      setBusy(false);
    }
  };

  if (!settings || !report) {
    return <div className="p-10 text-text-secondary">{error || "Loading school console…"}</div>;
  }

  const metrics = [
    ["Students", report.studentCount, Users],
    ["Teachers", report.teacherCount, Activity],
    ["Classes", report.classCount, BookOpen],
    ["Completion rate", report.completionRate === null ? "No assignments" : `${report.completionRate}%`, CheckCircle2],
    ["Engaged this week", report.engagementRate === null ? "No students" : `${report.engagementRate}%`, Activity],
    ["Overdue assignments", report.overdueCount, Clock],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">School administration</p>
        <h1 className="mt-2 text-4xl font-black text-text-primary">{school?.name}</h1>
        <p className="mt-2 text-sm text-text-secondary">Manage school-wide safety, imports, and reporting.</p>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600">{message}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-card-border bg-card p-5">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs font-bold text-text-tertiary">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Activity pulse</h2>
          <p className="mt-1 text-xs text-text-tertiary">Student assignment submissions per day, last seven days.</p>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {(report.activityPulse || []).map((day: { date: string; submissions: number }) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-text-secondary">{day.submissions}</span>
                <div className="flex h-24 w-full items-end rounded-lg bg-card-hover p-1">
                  <div
                    className="w-full rounded-md bg-primary"
                    style={{ height: `${Math.max(4, Math.min(100, day.submissions * 12))}%` }}
                    title={`${day.submissions} submissions`}
                  />
                </div>
                <span className="text-[9px] text-text-tertiary">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-tertiary">
            Engagement is the share of enrolled students with at least one assignment submission in the last seven days.
            {report.engagementHasComparison
              ? ` Change vs previous week: ${report.engagementChange > 0 ? "+" : ""}${report.engagementChange}%.`
              : " No previous-week activity is available for comparison."}
          </p>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Hall of Fame</h2>
          <p className="mt-1 text-xs text-text-tertiary">Top five students by XP in this school.</p>
          <ol className="mt-4 space-y-3">
            {(report.hallOfFame || []).map((student: { studentName: string; xp: number }, index: number) => (
              <li key={`${student.studentName}-${index}`} className="flex items-center justify-between rounded-xl bg-card-hover px-4 py-3">
                <span className="text-sm font-bold text-text-primary">{index + 1}. {student.studentName}</span>
                <span className="text-xs font-black text-primary">{student.xp.toLocaleString()} XP</span>
              </li>
            ))}
            {!report.hallOfFame?.length && <li className="rounded-xl bg-card-hover px-4 py-3 text-sm text-text-tertiary">No student activity yet.</li>}
          </ol>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Student safety switches</h2>
          <div className="mt-4 divide-y divide-card-border">
            {SWITCHES.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 py-3 text-sm font-bold text-text-secondary">
                {label}
                <input
                  type="checkbox"
                  checked={settings[key] as boolean}
                  disabled={busy}
                  onChange={(event) => saveSetting(key, event.target.checked)}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
          <label className="mt-5 block text-sm font-bold text-text-secondary">
            Leaderboard audience
            <select
              value={settings.leaderboardScope}
              onChange={(event) => saveSetting("leaderboardScope", event.target.value)}
              className="mt-2 block w-full rounded-xl border border-card-border bg-background p-3"
            >
              <option value="class">Class</option>
              <option value="year">Year group</option>
              <option value="school">Whole school</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">CSV account import</h2>
          <p className="mt-2 text-xs text-text-secondary">
            Headers: username, displayName, password; optional: role (Student, Teacher, SchoolAdmin), schoolYear, team. Passwords must be at least 10 characters.
          </p>
          <textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            rows={7}
            placeholder={"username,displayName,password,role,schoolYear,team\nstudent01,Student One,TempPassword123,Student,Year 7,Blue"}
            className="mt-4 w-full rounded-xl border border-card-border bg-background p-3 font-mono text-xs"
          />
          <div className="mt-3 max-h-32 space-y-2 overflow-auto">
            {classes.map((classItem) => (
              <label key={classItem._id} className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={classIds.includes(classItem._id)}
                  onChange={(event) => setClassIds((current) => event.target.checked ? [...current, classItem._id] : current.filter((id) => id !== classItem._id))}
                />
                {classItem.name}
              </label>
            ))}
          </div>
          <button onClick={importUsers} disabled={busy || !csv.trim()} className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import accounts
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">Create a class</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Class name" maxLength={120} className="rounded-xl border border-card-border bg-background p-3" />
          <select value={classTeacherId} onChange={(event) => setClassTeacherId(event.target.value)} className="rounded-xl border border-card-border bg-background p-3">
            <option value="">Select teacher</option>
            {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.displayName || teacher.username}</option>)}
          </select>
          <input value={classYear} onChange={(event) => setClassYear(event.target.value)} placeholder="Year group (optional)" maxLength={40} className="rounded-xl border border-card-border bg-background p-3" />
        </div>
        <button disabled={busy || !className.trim() || !classTeacherId} onClick={createClass} className="mt-4 rounded-xl bg-primary px-4 py-3 text-xs font-black text-white disabled:opacity-50">Create class</button>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Reward caps per assignment type</h2>
          <p className="mt-1 text-xs text-text-tertiary">Awards above either per-award or per-day limit require administrator approval.</p>
          {rewardRules && (Object.keys(rewardRules) as TaskTypeKey[]).map((type) => {
            const rule = rewardRules[type];
            return (
            <fieldset key={type} className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-card-border p-4">
              <legend className="px-2 text-xs font-black capitalize text-primary">{type}</legend>
              {REWARD_FIELDS.map(([key, label]) => (
                <label key={key} className="text-[10px] font-bold text-text-tertiary">
                  {label}
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={rule[key]}
                    onChange={(event) => setRewardRules((current) => current
                      ? { ...current, [type]: { ...current[type], [key]: Number(event.target.value) } }
                      : current)}
                    className="mt-1 w-full rounded-lg border border-card-border bg-background p-2 text-sm text-text-primary"
                  />
                </label>
              ))}
            </fieldset>
          );})}
          <button disabled={busy} onClick={() => saveComplexSetting("rewardsByTaskType", rewardRules)} className="mt-4 rounded-xl bg-primary px-4 py-3 text-xs font-black text-white disabled:opacity-50">Save reward caps</button>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Behaviour points & teams</h2>
          {behaviorRules && <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {BEHAVIOR_FIELDS.map(([key, label]) => (
                <label key={key} className="text-[10px] font-bold text-text-tertiary">
                  {label}
                  <input
                    type="number"
                    min={0}
                    value={behaviorRules[key]}
                    onChange={(event) => setBehaviorRules((current) => current
                      ? { ...current, [key]: Number(event.target.value) }
                      : current)}
                    className="mt-1 w-full rounded-lg border border-card-border bg-background p-2 text-sm text-text-primary"
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-bold text-text-secondary">
              <input type="checkbox" checked={behaviorRules.adminApprovalAboveCap} onChange={(event) => setBehaviorRules((current) => current ? { ...current, adminApprovalAboveCap: event.target.checked } : current)} />
              Require admin approval above caps
            </label>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">Categories (one per line: name,points)</p>
              <textarea
                rows={4}
                value={behaviorRules.categories.map((category) => `${category.name},${category.defaultPoints}`).join("\n")}
                onChange={(event) => setBehaviorRules((current) => current ? ({
                  ...current,
                  categories: event.target.value.split(/\r?\n/).filter(Boolean).map((line) => {
                    const [name, pointValue] = line.split(",");
                    return { name: name?.trim(), defaultPoints: Number(pointValue) };
                  }),
                }) : current)}
                className="w-full rounded-xl border border-card-border bg-background p-3 text-sm"
              />
            </div>
            <button disabled={busy} onClick={() => saveComplexSetting("behavior", behaviorRules)} className="mt-4 rounded-xl bg-primary px-4 py-3 text-xs font-black text-white disabled:opacity-50">Save behaviour rules</button>
          </>}
          <label className="mt-6 block text-sm font-bold text-text-secondary">
            House / team names
            <input value={teams} onChange={(event) => setTeams(event.target.value)} placeholder="Blue, Green, Gold" className="mt-2 w-full rounded-xl border border-card-border bg-background p-3" />
          </label>
          <button disabled={busy} onClick={() => saveComplexSetting("teams", teams.split(",").map((team) => team.trim()).filter(Boolean))} className="mt-3 rounded-xl border border-card-border px-4 py-3 text-xs font-black text-text-primary disabled:opacity-50">Save teams</button>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">School activity summary</h2>
        <p className="mt-3 text-sm text-text-secondary">
          {report.taskCount} assignments · {report.approvedCount} approved submissions · {report.pendingCount} awaiting review · {report.overdueCount} overdue assignments
        </p>
        <p className="mt-2 text-xs text-text-tertiary">{teachers.length} teachers configured across {classes.length} classes.</p>
      </section>

      {behaviorReport && (
        <section className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">School-wide behaviour totals</h2>
          <p className="mt-2 text-sm text-text-secondary">All approved, non-reversed behaviour records · School total: <strong>{behaviorReport.totals?.school ?? 0}</strong></p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {([
              ["Teams / houses", behaviorReport.totals?.team || []],
              ["Year groups", behaviorReport.totals?.year || []],
              ["Classes", behaviorReport.totals?.class || []],
            ] as Array<[string, Array<{ name: string; points: number }>]>).map(([title, totals]) => (
              <div key={title}>
                <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary">{title}</h3>
                <div className="mt-2 space-y-2">
                  {totals.length
                    ? totals.map((item) => <div key={item.name} className="flex justify-between rounded-lg bg-background px-3 py-2 text-sm"><span>{item.name}</span><strong>{item.points}</strong></div>)
                    : <p className="text-sm text-text-tertiary">No totals yet.</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">Teacher awards requiring approval</h2>
        {!pendingRewards.length && <p className="mt-3 text-sm text-text-tertiary">No pending reward approvals.</p>}
        <div className="mt-4 space-y-3">
          {pendingRewards.map((request) => (
            <div key={request._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border p-4">
              <div>
                <p className="font-bold text-text-primary">{request.coins} coins + {request.xp} XP · {request.students?.length} students</p>
                <p className="text-xs text-text-secondary">{request.reason} · {request.class?.name} · {request.teacher?.displayName || request.teacher?.username} · {request.taskType}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => decideReward(request._id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button>
                <button disabled={busy} onClick={() => decideReward(request._id, "reject")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">Teacher reward audit log</h2>
        <p className="mt-1 text-xs text-text-tertiary">Latest 200 issued assignment and teacher awards, including recipient, giver, amount, and reason.</p>
        {!rewardHistory.length && <p className="mt-3 text-sm text-text-tertiary">No rewards have been issued yet.</p>}
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {rewardHistory.map((entry) => (
            <div key={entry._id} className="grid gap-1 rounded-xl border border-card-border p-3 text-sm sm:grid-cols-[1fr_auto]">
              <p className="font-bold text-text-primary">
                {entry.user?.displayName || entry.user?.username || "Student"} received {entry.amount} coins and {entry.xpAmount || 0} XP
              </p>
              <p className="text-xs text-text-tertiary">
                From {entry.awardedBy?.displayName || entry.awardedBy?.username || "Teacher"} · {entry.reason || entry.description} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {hasMoreRewardHistory && (
          <button
            type="button"
            disabled={loadingRewardHistory}
            onClick={loadOlderRewardHistory}
            className="mt-4 rounded-lg border border-card-border px-4 py-2 text-xs font-bold text-text-primary disabled:opacity-50"
          >
            {loadingRewardHistory ? "Loading…" : "Load older awards"}
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">Behaviour awards requiring approval</h2>
        {!pending.length && <p className="mt-3 text-sm text-text-tertiary">No pending approvals.</p>}
        <div className="mt-4 space-y-3">
          {pending.map((record) => (
            <div key={record._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border p-4">
              <div>
                <p className="font-bold text-text-primary">{record.student?.displayName || record.student?.username} · {record.points} points · {record.category}</p>
                <p className="text-xs text-text-secondary">{record.reason} · {record.class?.name} · requested by {record.teacher?.displayName || record.teacher?.username}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => decide(record._id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"><CheckCircle2 className="inline h-4 w-4" /> Approve</button>
                <button disabled={busy} onClick={() => decide(record._id, "reject")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white"><AlertCircle className="inline h-4 w-4" /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
