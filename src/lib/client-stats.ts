"use client";

type StatsResponse = {
  success: true;
  stats: Record<string, unknown>;
} | {
  success: false;
  error?: string;
};

let cached: { key: string; data: StatsResponse; fetchedAt: number } | null = null;
let pending: { key: string; promise: Promise<StatsResponse> } | null = null;
let generation = 0;
let activeKey: string | null = null;
const CACHE_TTL_MS = 30_000;

export async function fetchStatsOnce(key: string): Promise<StatsResponse> {
  if (activeKey !== key) {
    generation++;
    cached = null;
    pending = null;
    activeKey = key;
  }
  if (cached?.key === key && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;
  if (pending?.key === key) return pending.promise;

  const requestGeneration = generation;
  const request = fetch("/api/user/stats")
    .then(async (response) => {
      const data = await response.json() as StatsResponse;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error || "Unable to load account statistics." : "Unable to load account statistics.");
      }
      if (requestGeneration !== generation) throw new Error("STALE_STATS_REQUEST");
      cached = { key, data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      if (pending?.promise === request) pending = null;
    });
  pending = { key, promise: request };
  try {
    return await request;
  } catch (error) {
    if (requestGeneration !== generation && activeKey === key) return fetchStatsOnce(key);
    throw error;
  }
}

export function invalidateStatsCache() {
  generation++;
  cached = null;
  pending = null;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("classcrib:stats-invalidated"));
}
