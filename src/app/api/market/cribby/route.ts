import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isStudentFeatureEnabled } from '@/lib/student-access';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  return (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.length <= 4_000;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid chat request.' }, { status: 400 });
    }
    const rawMessages = (body as Record<string, unknown>).messages;
    const actor = session.user as { id?: string; role?: string };
    if (!actor.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = actor.id;
    if (!Array.isArray(rawMessages) || rawMessages.length < 1 || rawMessages.length > 20 ||
        !rawMessages.every(isChatMessage) ||
        rawMessages[rawMessages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Invalid chat message.' }, { status: 400 });
    }
    const messages = rawMessages as ChatMessage[];
    const userMessages = messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content);

    await dbConnect();
    if (actor.role === 'Student' && !(await isStudentFeatureEnabled(userId, 'allowCribbyAI'))) {
      return NextResponse.json({ error: 'Marketplace AI is disabled by a class administrator.' }, { status: 403 });
    }
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: userMessages,
    });
    if (moderation.results.some((result) => result.flagged)) {
      return NextResponse.json({ error: 'Please rephrase your message and keep the chat appropriate.' }, { status: 400 });
    }

    const marketResponse = await fetch(new URL('/api/market/prices', req.url), { cache: 'no-store' });
    if (!marketResponse.ok) return NextResponse.json({ error: 'Market prices are unavailable.' }, { status: 503 });
    const marketData = await marketResponse.json() as {
      prices?: Partial<Record<'gold' | 'silver' | 'cnc500', number>>;
    };

    const systemPrompt = `
      You are Cribby, the AI Marketplace Assistant for ClassCrib.
      Your goal is to explain the marketplace and investment system to students.
      MARKET CONTEXT:
      - Illustrative prices: Gold ${marketData?.prices?.gold}, Silver ${marketData?.prices?.silver}, CNC500 ${marketData?.prices?.cnc500}.
      
      INSTRUCTIONS:
      1. Explain things in a fun, simple, and encouraging way for younger students.
      2. Explain concepts neutrally and do not recommend buying, selling, or trading any specific asset.
      3. If they ask "Explain Me", provide a comprehensive but concise overview of the Portfolio, Terminal, and Store.
      4. State that this is an educational simulation and not financial advice.
      5. Do not ask for personal information.
      6. Use Markdown for formatting.
    `;

    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
    ];
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      max_tokens: 800,
    });

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: response.choices[0].message.content
      }
    });

  } catch (error: unknown) {
    console.error('Market Cribby Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process marketplace chat.' }, { status: 500 });
  }
}
