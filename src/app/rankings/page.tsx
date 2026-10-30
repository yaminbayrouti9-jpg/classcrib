import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { serialize } from "@/lib/serialize";
import RankingsView from "@/components/RankingsView";
import Class from "@/models/Class";
import School from "@/models/School";
import { redirect } from "next/navigation";

export default async function RankingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  await dbConnect();
  
  const isStudent = (session.user as any).role === 'Student';
  if (!isStudent && (session.user as any).role !== 'Teacher') redirect("/dashboard");
  const userId = (session.user as any).id;
  let rankedStudentIds: unknown[] = [];
  if (isStudent) {
    const user = await User.findById(userId).select("school schoolYear").lean();
    const school = user?.school ? await School.findById(user.school).select("settings.allowLeaderboards settings.leaderboardScope").lean() as unknown as { settings?: { allowLeaderboards?: boolean; leaderboardScope?: string } } | null : null;
    if (school?.settings?.allowLeaderboards !== false) {
      const scope = school?.settings?.leaderboardScope || "class";
      if (scope === "school" && user?.school) {
        const allowedClasses = await Class.find({ school: user.school, "settings.allowLeaderboard": { $ne: false } }).select("students");
        rankedStudentIds = [...new Set(allowedClasses.flatMap((classDoc) => classDoc.students.map((id) => id.toString())))];
      } else if (scope === "year" && user?.school && user.schoolYear) {
        const allowedClasses = await Class.find({ school: user.school, "settings.allowLeaderboard": { $ne: false } }).select("students");
        const allowedStudentIds = [...new Set(allowedClasses.flatMap((classDoc) => classDoc.students.map((id) => id.toString())))];
        rankedStudentIds = await User.find({ role: "Student", school: user.school, schoolYear: user.schoolYear, _id: { $in: allowedStudentIds } }).distinct("_id");
      } else {
        const visibleClasses = await Class.find({ students: userId, "settings.allowLeaderboard": { $ne: false } }).select("students");
        rankedStudentIds = [...new Set(visibleClasses.flatMap((classDoc) => classDoc.students.map((id) => id.toString())))];
      }
    }
  } else {
    const teacherClasses = await Class.find({ teacher: userId, "settings.allowLeaderboard": { $ne: false } }).select("students");
    rankedStudentIds = [...new Set(teacherClasses.flatMap((classDoc) => classDoc.students.map((id) => id.toString())))];
  }
  const academicRankings = await User.find({ role: 'Student', privateMode: { $ne: true }, _id: { $in: rankedStudentIds } })
    .sort({ xp: -1 })
    .limit(50)
    .lean();

  const propertyRankings = await User.find({ role: 'Student', privateMode: { $ne: true }, _id: { $in: rankedStudentIds } })
    .sort({ homeLevel: -1, coins: -1 })
    .limit(50)
    .lean();

  const currentUserId = (session?.user as any)?.id;
  
  return (
    <RankingsView 
      academicUsers={serialize(academicRankings)} 
      propertyUsers={serialize(propertyRankings)}
      currentUserId={currentUserId} 
    />
  );
}
