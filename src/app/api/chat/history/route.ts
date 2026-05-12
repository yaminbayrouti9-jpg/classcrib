import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Fetch messages for a specific chat
      const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
      return NextResponse.json(messages);
    } else {
      // Fetch all chats for the user
      const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
      return NextResponse.json(chats);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });

    await dbConnect();
    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
