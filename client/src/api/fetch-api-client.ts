/**
 * FetchApiClient: the `ApiClient` implementation over `fetch`. It owns URL building, JSON
 * encoding, timeouts and error mapping (`{error:{code,message}}` -> `ApiError`, transport failures
 * -> `NetworkError`), and nothing else.
 */
import type { ContentData, SessionSnapshot } from '@commander/engine';
import { API_TIMEOUT_MS } from '../game/constants';
import {
  ApiError,
  NetworkError,
  type ApiClient,
  type LeaderboardEntry,
  type LeaderboardQuery,
  type PlayerRecord,
  type RunSummary,
  type ScoreReceipt,
  type ScoreSubmission,
} from './types';

/** Default URL prefix of the API (proxied to the server by Vite in development). */
export const DEFAULT_API_BASE = '/api';

type FetchFunction = typeof fetch;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
}

/** `fetch`-based API client. */
export class FetchApiClient implements ApiClient {
  constructor(
    private readonly baseUrl: string = DEFAULT_API_BASE,
    private readonly fetchFn: FetchFunction = (...args) => fetch(...args),
    private readonly defaultTimeoutMs: number = API_TIMEOUT_MS,
  ) {}

  async health(): Promise<void> {
    await this.request<unknown>('/health');
  }

  getContent(options?: { timeoutMs?: number }): Promise<ContentData> {
    return this.request<ContentData>('/content', { timeoutMs: options?.timeoutMs });
  }

  createPlayer(callsign: string): Promise<PlayerRecord> {
    return this.request<PlayerRecord>('/players', { method: 'POST', body: { callsign } });
  }

  async listRuns(playerId: string): Promise<RunSummary[]> {
    const result = await this.request<{ runs: RunSummary[] }>(`/progress/${enc(playerId)}`);
    return result.runs;
  }

  getRun(playerId: string, runId: string): Promise<SessionSnapshot> {
    return this.request<SessionSnapshot>(`/progress/${enc(playerId)}/${enc(runId)}`);
  }

  saveRun(
    playerId: string,
    runId: string,
    snapshot: SessionSnapshot,
  ): Promise<{ updatedAt: string }> {
    return this.request<{ updatedAt: string }>(`/progress/${enc(playerId)}/${enc(runId)}`, {
      method: 'PUT',
      body: snapshot,
    });
  }

  async deleteRun(playerId: string, runId: string): Promise<void> {
    await this.request<undefined>(`/progress/${enc(playerId)}/${enc(runId)}`, {
      method: 'DELETE',
    });
  }

  async leaderboard(query: LeaderboardQuery = {}): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    if (query.world) params.set('world', query.world);
    if (query.limit) params.set('limit', String(query.limit));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    const result = await this.request<{ entries: LeaderboardEntry[] }>(`/leaderboard${suffix}`);
    return result.entries;
  }

  submitScore(submission: ScoreSubmission): Promise<ScoreReceipt> {
    return this.request<ScoreReceipt>('/leaderboard', { method: 'POST', body: submission });
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? this.defaultTimeoutMs);
    try {
      const response = await this.send(path, options, controller.signal);
      if (!response.ok) throw await toApiError(response);
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new NetworkError(`Could not reach the server (${path})`, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }

  private send(path: string, options: RequestOptions, signal: AbortSignal): Promise<Response> {
    const hasBody = options.body !== undefined;
    return this.fetchFn(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal,
    });
  }
}

const enc = encodeURIComponent;

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } };
    return new ApiError(
      response.status,
      payload.error?.code ?? 'HTTP_ERROR',
      payload.error?.message ?? response.statusText,
    );
  } catch {
    return new ApiError(response.status, 'HTTP_ERROR', response.statusText || 'Request failed');
  }
}
