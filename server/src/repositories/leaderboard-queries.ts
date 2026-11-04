/**
 * Pure leaderboard ordering and ranking rules shared by every repository driver, so the JSON and
 * in-memory implementations cannot drift apart: score descending, ties broken by earlier time,
 * then by insertion order (Array.sort is stable).
 */
import type { LeaderboardEntry, LeaderboardQuery } from '../domain/models.js';

/** Orders two entries: better first. */
export function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (a.score !== b.score) return b.score - a.score;
  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/** Applies the world filter, ordering and limit. */
export function selectTop(
  entries: readonly LeaderboardEntry[],
  query: LeaderboardQuery,
): LeaderboardEntry[] {
  return entries
    .filter((entry) => query.worldId === undefined || entry.worldId === query.worldId)
    .sort(compareEntries)
    .slice(0, query.limit);
}

/** 1-based rank of `entry` among the entries of its world. */
export function rankAmong(entries: readonly LeaderboardEntry[], entry: LeaderboardEntry): number {
  const sameWorld = entries.filter((other) => other.worldId === entry.worldId);
  const ordered = [...sameWorld].sort(compareEntries);
  const index = ordered.findIndex((other) => other.id === entry.id);
  return index === -1 ? ordered.length + 1 : index + 1;
}
