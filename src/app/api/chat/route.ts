import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, chatId, image } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();

    // 1. Get or Create Chat Session
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await Chat.create({
        userId,
        title: messages[messages.length - 1].content.substring(0, 40) + '...',
      });
      currentChatId = newChat._id;
    }

    // 2. Fetch User Context for System Prompt
    const user = await User.findById(userId).lean();
    const tasks = await Task.find({ 
      class: { $in: (user as any).workspaces },
      status: { $ne: 'Completed' }
    }).sort({ dueDate: 1 }).limit(5).lean();

    const systemPrompt = `
      You are Cribby, the premium AI Study Assistant for ClassCrib. 
      Your tone is encouraging, intelligent, and slightly gamified.
      You help students with task management, financial learning, and environmental awareness.
      
      USER CONTEXT:
      - Name: ${user?.username}
      - Coins: ${user?.coins}
      - Level: ${user?.level} (XP: ${user?.xp})
      - Green XP: ${user?.greenXp}
      - Home Level: ${user?.homeLevel}
      - Assets: Property: ${user?.assets?.property}, Business: ${user?.assets?.business}, Gold: ${user?.assets?.gold}
      - Billing: Electricity: ${user?.electricityStatus}, Water: ${user?.waterStatus}, Taxes: ${user?.taxStatus}
      
      PENDING TASKS:
      ${tasks.map(t => `- ${t.title} (Due: ${new Date(t.dueDate).toLocaleDateString()}, Reward: ${t.coins} coins)`).join('\n')}

      INSTRUCTIONS:
      1. TUTOR MODE: Never give direct answers to questions or homework problems immediately. 
      2. Instead, guide the student towards the answer by asking Socratic questions, giving hints, or explaining the underlying concepts.
      3. Encourage them to try a step and then show you their work.
      4. Always keep the ClassCrib ecosystem in mind. Suggest ways to earn coins or XP when appropriate.
      5. If asked about financial learning, relate it to their assets or current coin balance.
      6. Use Markdown for formatting.
    `;

    // 3. Prepare Messages for OpenAI
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // If there's an image, add it to the last user message
    if (image) {
      const lastMessageIndex = apiMessages.length - 1;
      if (apiMessages[lastMessageIndex].role === 'user') {
        apiMessages[lastMessageIndex].content = [
          { type: 'text', text: apiMessages[lastMessageIndex].content },
          { type: 'image_url', image_url: { url: image } }
        ] as any;
      }
    }

    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for vision and better reasoning
      messages: apiMessages as any,
      max_tokens: 1000,
    });

    const assistantContent = response.choices[0].message.content;

    // 5. Store Messages in DB
    const userMsg = messages[messages.length - 1];
    await Message.create({
      chatId: currentChatId,
      role: 'user',
      content: userMsg.content,
      image: image || null,
    });

    const assistantMsg = await Message.create({
      chatId: currentChatId,
      role: 'assistant',
      content: assistantContent,
    });

    // Update Chat Title and Last Message
    await Chat.findByIdAndUpdate(currentChatId, {
      lastMessage: assistantContent?.substring(0, 100),
    });

    return NextResponse.json({
      chatId: currentChatId,
      message: assistantMsg,
    });

  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
