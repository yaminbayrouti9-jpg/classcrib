import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userSession = session?.user as any;
    if (!session || !userSession?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { layout } = await req.json();
    await dbConnect();

    await User.updateOne(
      { username: userSession.username },
      { $set: { interiorLayout: layout } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Layout Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userSession = session?.user as any;
    if (!session || !userSession?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ username: userSession.username }, "interiorLayout");

    return NextResponse.json({ layout: user?.interiorLayout || {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
