import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { serialize } from "@/lib/serialize";
import RankingsView from "@/components/RankingsView";

export default async function RankingsPage() {
  const session = await getServerSession(authOptions);
  
  await dbConnect();
  
  const academicRankings = await User.find({ role: 'Student' })
    .sort({ xp: -1 })
    .limit(50)
    .lean();

  const propertyRankings = await User.find({ role: 'Student' })
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
