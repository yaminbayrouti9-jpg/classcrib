import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Seeded random for consistent "offline" market
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export async function GET() {
  try {
    // Symbols: GC=F (Gold), SI=F (Silver), ^GSPC (S&P 500)
    const symbols = ['GC=F', 'SI=F', '^GSPC'];
    
    // Fetch quotes
    const results = await Promise.all(
      symbols.map(symbol => 
        yahooFinance.quote(symbol).catch(err => {
          console.error(`Failed to fetch ${symbol}:`, err);
          return null;
        })
      )
    );

    const [gold, silver, sp500] = results;

    // Use current date for daily fluctuations
    const daySeed = Math.floor(Date.now() / 86400000);
    const mockGold = 2300 + (seededRandom(daySeed) * 200);
    const mockSilver = 25 + (seededRandom(daySeed + 1) * 10);
    const mockSP500 = (5000 + (seededRandom(daySeed + 2) * 500)) * 1.5;

    // Simulate Business and Real Estate based on SP500 but more volatile
    const businessPrice = 5000 * (1 + (seededRandom(daySeed + 6) * 0.2 - 0.1));
    const realEstatePrice = 15000 * (1 + (seededRandom(daySeed + 7) * 0.1 - 0.05));

    const prices = {
      gold: gold?.regularMarketPrice || mockGold,
      silver: silver?.regularMarketPrice || mockSilver,
      cnc500: (sp500?.regularMarketPrice || mockSP500) * 1.5,
      business: businessPrice,
      property: realEstatePrice,
      trends: {
        gold: gold?.regularMarketChangePercent || (seededRandom(daySeed + 3) * 2 - 1),
        silver: silver?.regularMarketChangePercent || (seededRandom(daySeed + 4) * 4 - 2),
        cnc500: sp500?.regularMarketChangePercent || (seededRandom(daySeed + 5) * 1 - 0.5),
        business: (seededRandom(daySeed + 8) * 6 - 3),
        property: (seededRandom(daySeed + 9) * 2 - 1),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Generate daily tips
    const tips = [
      prices.trends.gold > 0.5 ? "Gold is showing strength. Secure your metals." : "Gold is stable, great for hedging.",
      prices.trends.business > 2 ? "The Tech sector is booming! Consider increasing your business equity." : "Business valuations are cooling off. Watch for entry points.",
      prices.trends.property < -1 ? "Real estate is dipping! A perfect time to expand your property portfolio." : "Real estate remains a rock-solid long-term investment.",
      "The CNC 500 index follows the top digital companies. Extremely stable.",
      "Always keep some liquid coins for emergency utility bills!",
      "Diversification helps protect your wealth from market crashes."
    ];

    return NextResponse.json({ 
      success: true, 
      prices,
      tips,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error("Market API Fatal Error:", error);
    return NextResponse.json({ 
      success: true, 
      prices: {
        gold: 2350.45,
        silver: 28.20,
        cnc500: 7800.12,
        business: 5200.50,
        property: 15500.00,
        trends: { gold: 0, silver: 0, cnc500: 0, business: 0, property: 0 },
        lastUpdated: new Date().toISOString(),
      },
      tips: ["Market data is currently in emergency simulation mode."],
      timestamp: Date.now()
    });
  }
}
