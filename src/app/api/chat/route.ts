import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import mongoose from 'mongoose';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isStudentFeatureEnabled } from '@/lib/student-access';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  return (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.length <= 8_000;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid chat request.' }, { status: 400 });
    }
    const { messages: rawMessages, chatId, image } = body as Record<string, unknown>;
    const actor = session.user as { id?: string; role?: string };
    if (!actor.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = actor.id;

    if (!Array.isArray(rawMessages) || rawMessages.length < 1 || rawMessages.length > 20 ||
        !rawMessages.every(isChatMessage) ||
        rawMessages[rawMessages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Chat requires 1 to 20 valid messages, each under 8,000 characters.' }, { status: 400 });
    }
    const messages = rawMessages as ChatMessage[];
    const userMessages = messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content);
    if (image !== undefined && image !== null && image !== '' &&
        (typeof image !== 'string' || image.length > 5_000_000 ||
        !/^data:image\/(png|jpeg|webp);base64,/i.test(image))) {
      return NextResponse.json({ error: 'Image must be PNG, JPEG, or WebP and smaller than 5 MB.' }, { status: 400 });
    }
    if (chatId && (typeof chatId !== 'string' || !mongoose.isValidObjectId(chatId))) {
      return NextResponse.json({ error: 'Invalid chat ID.' }, { status: 400 });
    }
    const imageData = typeof image === 'string' && image ? image : undefined;
    const requestedChatId = typeof chatId === 'string' ? chatId : undefined;

    await dbConnect();

    // 1. Get or Create Chat Session
    let currentChatId: string | mongoose.Types.ObjectId;
    if (requestedChatId) {
      currentChatId = requestedChatId;
      const ownedChat = await Chat.findOne({ _id: currentChatId, userId }).select('_id');
      if (!ownedChat) return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });
    } else {
      const newChat = await Chat.create({
        userId,
        title: messages[messages.length - 1].content.substring(0, 40) + '...',
      });
      currentChatId = newChat._id;
    }

    // 2. Fetch User Context for System Prompt
    const user = await User.findById(userId).select('workspaces classes').lean();
    const classIds = user?.workspaces?.length ? user.workspaces : user?.classes || [];
    if (actor.role === 'Student' && !(await isStudentFeatureEnabled(userId, 'allowCribbyAI'))) {
      return NextResponse.json({ error: 'Cribby AI is disabled by a class administrator.' }, { status: 403 });
    }
    const tasks = classIds.length ? await Task.find({
      $and: [
        { $or: [
          { class: { $in: classIds } },
          { workspace: { $in: classIds } },
          { classes: { $in: classIds } },
        ] },
        { $or: [
          { assignedStudents: { $exists: false } },
          { assignedStudents: { $size: 0 } },
          { assignedStudents: userId },
        ] },
      ],
    }).sort({ dueDate: 1 }).limit(5).lean() : [];

    const systemPrompt = `
      You are Cribby, the premium AI Study Assistant for ClassCrib. 
      Your tone is encouraging, intelligent, and slightly gamified.
      You help students with learning and assignment planning.
      
      PENDING TASKS:
      ${tasks.map(t => `- ${t.title} (Due: ${new Date(t.dueDate).toLocaleDateString()}${new Date(t.dueDate).getTime() < Date.now() ? ', OVERDUE' : ''})`).join('\n')}

      INSTRUCTIONS:
      1. TUTOR MODE: Never give direct answers to questions or homework problems immediately. 
      2. Instead, guide the student towards the answer by asking Socratic questions, giving hints, or explaining the underlying concepts.
      3. Encourage them to try a step and then show you their work.
      4. Do not request personal details. Do not provide personalized financial, tax, investment, or trading advice.
      5. For finance questions, provide general educational explanations only and remind students this is a simulation, not financial advice.
      6. Use Markdown for formatting.
    `;

    // 3. Prepare Messages for OpenAI
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((message, index) => {
        if (imageData && index === messages.length - 1) {
          return {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: message.content },
              { type: 'image_url' as const, image_url: { url: imageData } },
            ],
          };
        }
        return message.role === 'user'
          ? { role: 'user' as const, content: message.content }
          : { role: 'assistant' as const, content: message.content };
      }),
    ];

    // Apply OpenAI's safety classifier to student text before generating a reply.
    const moderationInput = [
      ...userMessages.map((text) => ({ type: 'text' as const, text })),
      ...(imageData ? [{ type: 'image_url' as const, image_url: { url: imageData } }] : []),
    ];
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: moderationInput,
    });
    if (moderation.results.some((result) => result.flagged)) {
      return NextResponse.json({ error: 'That message needs a teacher’s help. Please ask a trusted adult.' }, { status: 400 });
    }

    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for vision and better reasoning
      messages: apiMessages,
      max_tokens: 1000,
    });

    const assistantContent = response.choices[0].message.content;
    if (typeof assistantContent !== 'string') throw new Error('Cribby returned an empty response.');

    // 5. Store Messages in DB
    const userMsg = messages[messages.length - 1];
    await Message.create({
      chatId: currentChatId,
      role: 'user',
      content: userMsg.content,
      image: null,
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

  } catch (error: unknown) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process chat message.' }, { status: 500 });
  }
}
