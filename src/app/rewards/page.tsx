import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import RewardStudents from "@/components/teacher/RewardStudents";
import { redirect } from "next/navigation";
import { serialize } from "@/lib/serialize";

export default async function RewardsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'Teacher') {
    redirect("/dashboard");
  }

  await dbConnect();
  const userId = (session.user as any).id;
  
  const teacherClasses = await Class.find({ teacher: userId }).sort({ createdAt: -1 }).lean();

  return (
    <div className="min-h-screen">
      <RewardStudents initialClasses={serialize(teacherClasses)} />
    </div>
  );
}
