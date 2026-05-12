import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    await dbConnect();

    const user = await User.findById(userId).lean();
    const tasks = await Task.find({ 
      class: { $in: (user as any).workspaces },
      status: { $ne: 'Completed' }
    }).sort({ dueDate: 1 }).limit(3).lean();

    const systemPrompt = `
      You are Cribby, the AI assistant for ClassCrib. 
      Generate a single, punchy, helpful tip (max 120 characters) for the user's dashboard.
      The tip should be one of:
      - A task management tip based on their pending tasks.
      - A financial tip based on their coins or assets.
      - A "Go Green" tip for XP.
      - A motivational quote for students.

      USER CONTEXT:
      - Coins: ${user?.coins}
      - Pending Tasks: ${tasks.length}
      - Next Task: ${tasks[0]?.title || 'None'}
      - Electricity: ${user?.electricityStatus}
      
      Output ONLY the tip content in plain text. No quotes.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      max_tokens: 50,
    });

    const tipContent = response.choices[0].message.content?.trim();

    return NextResponse.json({ 
      tip: {
        content: tipContent,
        type: 'info'
      } 
    });

  } catch (error: any) {
    console.error('Tips API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
