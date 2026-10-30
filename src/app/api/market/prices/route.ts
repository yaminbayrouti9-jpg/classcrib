import { NextResponse } from 'next/server';

type MarketSnapshot = {
  prices: {
    gold: number;
    silver: number;
    cnc500: number;
    business: number;
    property: number;
    trends: Record<string, number>;
    lastUpdated: string;
  };
  tips: string[];
  ts: number;
  mode: 'live' | 'simulation' | 'stale';
};

// ─── Seeded random for daily consistency ───────────────────────────────────────
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// ─── Module-level server-side cache ───────────────────────────────────────────
let _priceCache: MarketSnapshot | null = null;
let _pricePromise: Promise<MarketSnapshot> | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`Market quote timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

async function getMarketPrices() {
  if (_priceCache && Date.now() - _priceCache.ts < CACHE_TTL_MS) {
    return _priceCache;
  }

  if (_pricePromise) return _pricePromise;

  _pricePromise = refreshMarketPrices();
  try {
    return await _pricePromise;
  } finally {
    _pricePromise = null;
  }
}

async function refreshMarketPrices(): Promise<MarketSnapshot> {
  const staleCache = _priceCache;
  const daySeed = Math.floor(Date.now() / 86400000);

  // Fallback values (seeded daily so they're consistent on same day)
  const fallbackGold   = 2300 + seededRandom(daySeed) * 200;
  const fallbackSilver = 25   + seededRandom(daySeed + 1) * 10;
  const fallbackSP500  = (5000 + seededRandom(daySeed + 2) * 500) * 1.5;

  let gold   = fallbackGold;
  let silver = fallbackSilver;
  let sp500  = fallbackSP500;
  let goldChange   = seededRandom(daySeed + 3) * 2 - 1;
  let silverChange = seededRandom(daySeed + 4) * 4 - 2;
  let sp500Change  = seededRandom(daySeed + 5) * 1 - 0.5;
  let mode: MarketSnapshot['mode'] = 'simulation';

  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yf = new YahooFinance();
    const [gRes, sRes, spRes] = await withTimeout(
      Promise.allSettled([
        yf.quote('GC=F'),
        yf.quote('SI=F'),
        yf.quote('^GSPC'),
      ]),
      4000
    );

    if (gRes.status === 'fulfilled' && gRes.value?.regularMarketPrice) {
      gold       = gRes.value.regularMarketPrice;
      goldChange = gRes.value.regularMarketChangePercent ?? goldChange;
    }
    if (sRes.status === 'fulfilled' && sRes.value?.regularMarketPrice) {
      silver       = sRes.value.regularMarketPrice;
      silverChange = sRes.value.regularMarketChangePercent ?? silverChange;
    }
    if (spRes.status === 'fulfilled' && spRes.value?.regularMarketPrice) {
      sp500       = spRes.value.regularMarketPrice * 1.5;
      sp500Change = spRes.value.regularMarketChangePercent ?? sp500Change;
    }
    if (
      gRes.status === 'fulfilled' && gRes.value?.regularMarketPrice &&
      sRes.status === 'fulfilled' && sRes.value?.regularMarketPrice &&
      spRes.status === 'fulfilled' && spRes.value?.regularMarketPrice
    ) {
      mode = 'live';
    }
  } catch (error) {
    console.warn('Market quotes unavailable; using cached or simulated prices.', error);
    if (staleCache) {
      _priceCache = { ...staleCache, ts: Date.now(), mode: 'stale' };
      return _priceCache;
    }
  }

  const businessPrice    = 5000  * (1 + (seededRandom(daySeed + 6) * 0.2 - 0.1));
  const realEstatePrice  = 15000 * (1 + (seededRandom(daySeed + 7) * 0.1 - 0.05));
  const businessChange   = seededRandom(daySeed + 8) * 6 - 3;
  const propertyChange   = seededRandom(daySeed + 9) * 2 - 1;

  const prices = {
    gold,
    silver,
    cnc500: sp500,
    business: businessPrice,
    property: realEstatePrice,
    trends: {
      gold:     goldChange,
      silver:   silverChange,
      cnc500:   sp500Change,
      business: businessChange,
      property: propertyChange,
    },
    lastUpdated: new Date().toISOString(),
  };

  const tips = [
    goldChange > 0.5
      ? 'In this simulation, gold is showing an upward price movement today.'
      : 'In this simulation, gold is relatively steady today.',
    businessChange > 2
      ? 'In this simulation, the business-equity price is higher than its recent baseline.'
      : 'In this simulation, the business-equity price is near or below its recent baseline.',
    propertyChange < -1
      ? 'In this simulation, the property price is lower than its recent baseline.'
      : 'In this simulation, the property price has changed only modestly.',
    'The CNC 500 is an illustrative index in this classroom simulation.',
    'Compare simulated price movements and consider how different choices affect a virtual portfolio.',
    'Diversification is a financial-literacy concept; it does not guarantee gains or prevent losses.',
  ];

  _priceCache = { prices, tips, ts: Date.now(), mode };
  return _priceCache;
}

export async function GET() {
  try {
    const { prices, tips, mode } = await getMarketPrices();
    return NextResponse.json(
      { success: true, prices, tips, mode, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
    );
  } catch (error: any) {
    console.error('Market API Error:', error);
    return NextResponse.json({
      success: true,
      prices: {
        gold: 2350.45,
        silver: 28.20,
        cnc500: 7800.12,
        business: 5200.50,
        property: 15500.00,
        trends: { gold: 0.4, silver: -0.2, cnc500: 0.1, business: 1.2, property: 0.5 },
        lastUpdated: new Date().toISOString(),
      },
      tips: ['Market data is temporarily in simulation mode. All figures are illustrative.'],
      mode: 'simulation',
      timestamp: Date.now(),
    });
  }
}
