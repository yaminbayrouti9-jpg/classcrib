import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    await dbConnect();

    const Class = (await import("@/models/Class")).default;
    const { nanoid } = await import("nanoid");

    const aiBanner = `https://image.pollinations.ai/prompt/abstract%20education%20pattern%20for%20${encodeURIComponent(name)}?width=800&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    const workspace = await Class.create({
      name,
      teacher: (session.user as any).id,
      inviteCode: nanoid(6).toUpperCase(),
      banner: aiBanner,
      students: [],
      posts: []
    });

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
