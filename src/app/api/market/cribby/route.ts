import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, marketData } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();
    const user = await User.findById(userId).lean();

    const systemPrompt = `
      You are Cribby, the AI Marketplace Assistant for ClassCrib.
      Your goal is to explain the marketplace and investment system to students.
      
      MARKET CONTEXT:
      - Student Coins: ${user?.coins || 0}
      - Student Net Worth: ${(user?.coins || 0) + (user?.assets?.gold || 0) * (marketData?.prices?.gold || 0) + (user?.assets?.silver || 0) * (marketData?.prices?.silver || 0)} (Approx)
      - Current Prices: Gold: ${marketData?.prices?.gold}, Silver: ${marketData?.prices?.silver}, CNC500: ${marketData?.prices?.cnc500}, Business Equity: ${marketData?.prices?.business / 100} (per 1%), Real Estate: ${marketData?.prices?.property}
      - Market Trends: Gold: ${marketData?.prices?.trends?.gold}%, Silver: ${marketData?.prices?.trends?.silver}%, Business: ${marketData?.prices?.trends?.business}%
      
      INSTRUCTIONS:
      1. Explain things in a fun, simple, and encouraging way for younger students.
      2. Use terms like "investing for the future", "growing your wealth", and "becoming a crib-mogul".
      3. If they ask "Explain Me", provide a comprehensive but concise overview of the Portfolio, Terminal, and Store.
      4. Suggest smart moves based on their current coin balance and market trends.
      5. DO NOT save this to any database. This is a live assistance session.
      6. Use Markdown for formatting.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      max_tokens: 800,
    });

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: response.choices[0].message.content
      }
    });

  } catch (error: any) {
    console.error('Market Cribby Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
