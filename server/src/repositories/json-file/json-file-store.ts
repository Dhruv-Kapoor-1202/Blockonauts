/**
 * JsonFileStore: a tiny durable document store used by the JSON repositories. Writes are atomic
 * (write a temp file, fsync, rename over the target) so a crash never leaves a half-written file,
 * and every operation on one file is serialised through a process-wide queue so concurrent
 * requests cannot interleave read-modify-write cycles. A missing file is an empty collection; a
 * corrupt file is quarantined next to the original (`*.corrupt-<time>`) and replaced by an empty
 * collection so the server keeps running without destroying the evidence.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { RENAME_RETRIES, RENAME_RETRY_DELAY_MS } from '../../config/constants.js';
import type { Logger } from '../../logging/logger.js';

/** Outcome of a read-modify-write step: the data to persist and a value for the caller. */
export interface Mutation<T, R> {
  /** Pass the same object that was read to skip the disk write. */
  next: T;
  result: R;
}

/** Per-file promise chains, shared by every store instance in the process. */
const queues = new Map<string, Promise<unknown>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Persists one JSON document of type `T` in one file. */
export class JsonFileStore<T> {
  private readonly file: string;

  /**
   * @param file path of the JSON file.
   * @param empty creates the initial document.
   * @param isValid shape guard; a failing document is treated as corrupt.
   * @param logger receives corruption warnings.
   */
  constructor(
    file: string,
    private readonly empty: () => T,
    private readonly isValid: (raw: unknown) => raw is T,
    private readonly logger?: Logger,
  ) {
    this.file = path.resolve(file);
  }

  /** Reads the current document (serialised behind pending writes). */
  read(): Promise<T> {
    return this.enqueue(() => this.load());
  }

  /** Atomically applies a read-modify-write step. */
  update<R>(step: (current: T) => Mutation<T, R>): Promise<R> {
    return this.enqueue(async () => {
      const current = await this.load();
      const { next, result } = step(current);
      if (next !== current) await this.writeAtomically(next);
      return result;
    });
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const previous = queues.get(this.file) ?? Promise.resolve();
    const run = previous.then(task, task);
    const tail = run.catch(() => undefined);
    queues.set(this.file, tail);
    void tail.then(() => {
      if (queues.get(this.file) === tail) queues.delete(this.file);
    });
    return run;
  }

  private async load(): Promise<T> {
    let text: string;
    try {
      text = await readFile(this.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return this.empty();
      throw error;
    }
    try {
      const parsed: unknown = JSON.parse(text);
      if (this.isValid(parsed)) return parsed;
    } catch {
      // falls through to quarantine
    }
    await this.quarantine();
    return this.empty();
  }

  private async quarantine(): Promise<void> {
    const backup = `${this.file}.corrupt-${Date.now()}`;
    await rename(this.file, backup);
    this.logger?.warn(`Corrupt data file ${this.file} moved to ${backup}; starting empty.`);
  }

  private async writeAtomically(data: T): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temp, 'w');
      try {
        await handle.writeFile(JSON.stringify(data, null, 2), 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      await this.renameWithRetry(temp);
    } catch (error) {
      await rm(temp, { force: true });
      throw error;
    }
  }

  // Windows can briefly refuse to replace a file that antivirus or an indexer has open.
  private async renameWithRetry(temp: string): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await rename(temp, this.file);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        const transient = code === 'EPERM' || code === 'EBUSY' || code === 'EACCES';
        if (!transient || attempt >= RENAME_RETRIES) throw error;
        await sleep(RENAME_RETRY_DELAY_MS * attempt);
      }
    }
  }
}
