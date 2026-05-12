import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { serialize } from "@/lib/serialize";
import NeighborhoodView from "@/components/NeighborhoodView";

export default async function NeighborhoodPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();

  const currentUserId = (session?.user as any).id;
  const currentUser = await User.findById(currentUserId);
  
  const allUserClassIds = [
    ...(currentUser?.workspaces || []),
    ...(currentUser?.classes || [])
  ];

  // Find classmates
  const classmates = await User.find({
    role: 'Student',
    $or: [
      { workspaces: { $in: allUserClassIds } },
      { classes: { $in: allUserClassIds } }
    ],
    _id: { $ne: currentUserId },
    privateMode: { $ne: true }
  }).lean();

  // Functional District Rating Calculation
  const allResidents = [...classmates, currentUser];
  const avgLevel = allResidents.reduce((acc, curr) => acc + (curr?.homeLevel || 1), 0) / allResidents.length;
  const avgXp = allResidents.reduce((acc, curr) => acc + (curr?.xp || 0), 0) / allResidents.length;
  
  let rating = "C";
  const score = (avgLevel * 10) + (avgXp / 500);
  if (score > 80) rating = "S+";
  else if (score > 60) rating = "A+";
  else if (score > 40) rating = "A";
  else if (score > 25) rating = "B+";
  else if (score > 15) rating = "B";

  return (
    <NeighborhoodView 
      initialClassmates={serialize(classmates)} 
      initialPrivacy={currentUser?.privateMode || false} 
      socialStreak={currentUser?.socialStreak || 0}
      districtRating={rating}
    />
  );
}
