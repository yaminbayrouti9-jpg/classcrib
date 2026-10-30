import Class from "@/models/Class";
import School from "@/models/School";
import User from "@/models/User";

export type StudentFeature =
  | "allowUsernameSearch"
  | "allowCoinGifts"
  | "allowClassChat"
  | "allowTradingTerminal"
  | "allowCribbyAI"
  | "allowLeaderboards";

export async function isStudentFeatureEnabled(userId: string, feature: StudentFeature): Promise<boolean> {
  const user = await User.findById(userId).select("school workspaces classes").lean();
  if (!user) return false;
  if (user.school) {
    const school = await School.findById(user.school).select(`settings.${feature}`).lean();
    const schoolSettings = (school as unknown as { settings?: Record<string, unknown> } | null)?.settings;
    if (!school || schoolSettings?.[feature] === false) return false;
  }
  const classIds = user.workspaces?.length ? user.workspaces : user.classes || [];
  const classes = await Class.find({ _id: { $in: classIds }, students: userId }).select("settings").lean();
  return classes.every((classDoc) => {
    const classFeature = feature === "allowLeaderboards" ? "allowLeaderboard" : feature;
    return (classDoc.settings as Record<string, unknown> | undefined)?.[classFeature] !== false;
  });
}
