/**
 * ContentLoader: turns a map of `relative/path.json -> parsed JSON` into a validated ContentData.
 * It is filesystem-free so the same code runs on the server (reads disk) and in the client's
 * build-time bundle (import.meta.glob). Every schema failure names the file and the node id.
 */
import type { z } from 'zod';
import type { ChapterContent, ContentData } from './bundle.js';
import {
  AchievementsFileSchema,
  CampaignSchema,
  CharactersFileSchema,
  ChapterSchema,
  ConfigSchema,
  DifficultiesFileSchema,
  FactsAndTipsSchema,
  InterludesFileSchema,
  NodesFileSchema,
  ResourcesFileSchema,
  WorldDefSchema,
} from './schemas/index.js';
import type { Interlude, StoryNode, WorldDef } from './schemas/index.js';

/** One problem found while loading content. */
export interface ContentIssue {
  severity: 'error' | 'warning';
  file?: string;
  location?: string;
  message: string;
}

/** Thrown when content cannot be loaded; carries every issue found. */
export class ContentLoadError extends Error {
  constructor(readonly issues: ContentIssue[]) {
    super(`Content failed to load:\n${issues.map(formatIssue).join('\n')}`);
    this.name = 'ContentLoadError';
  }
}

/** Where each authored item came from, for friendly validator messages. */
export type SourceIndex = Record<string, string>;

/** Result of loading: data plus an index of source files. */
export interface LoadedContent {
  data: ContentData;
  sources: SourceIndex;
}

/** Formats an issue as `error [file] location: message`. */
export function formatIssue(issue: ContentIssue): string {
  const where = [issue.file, issue.location].filter(Boolean).join(' › ');
  return `${issue.severity.toUpperCase()}${where ? ` [${where}]` : ''}: ${issue.message}`;
}

/** Index key helpers (shared with the validator). */
export const sourceKey = {
  node: (chapterId: string, nodeId: string) => `node:${chapterId}:${nodeId}`,
  interlude: (id: string) => `interlude:${id}`,
  chapter: (id: string) => `chapter:${id}`,
};

const CHAPTER_FILE = /^campaign\/chapters\/([^/]+)\/chapter\.json$/;
const NODES_FILE = /^campaign\/chapters\/([^/]+)\/nodes\/[^/]+\.json$/;
const INTERLUDE_FILE = /^campaign\/interludes\/[^/]+\.json$/;
const WORLD_FILE = /^worlds\/[^/]+\.json$/;

/** Loads and schema-validates content files. */
export class ContentLoader {
  private readonly issues: ContentIssue[] = [];

  private constructor(private readonly files: Record<string, unknown>) {}

  /**
   * @param files map of POSIX-style relative path to parsed JSON.
   * @throws ContentLoadError when any file fails its schema.
   */
  static load(files: Record<string, unknown>): LoadedContent {
    const loader = new ContentLoader(files);
    const result = loader.run();
    if (loader.issues.length > 0 || !result) throw new ContentLoadError(loader.issues);
    return result;
  }

  private run(): LoadedContent | undefined {
    const sources: SourceIndex = {};
    const config = this.parseSingle('config.json', ConfigSchema);
    const resources = this.parseSingle('resources.json', ResourcesFileSchema)?.resources;
    const characters = this.parseSingle('characters.json', CharactersFileSchema)?.characters;
    const difficulties = this.parseSingle(
      'difficulties.json',
      DifficultiesFileSchema,
    )?.difficulties;
    const achievements = this.parseSingle(
      'achievements.json',
      AchievementsFileSchema,
    )?.achievements;
    const factsAndTips = this.parseSingle('facts-and-tips.json', FactsAndTipsSchema);
    const campaign = this.parseSingle('campaign/campaign.json', CampaignSchema);

    const worlds: WorldDef[] = [];
    const interludes: Interlude[] = [];
    const chapters: Record<string, ChapterContent> = {};
    const chapterFolders = new Map<
      string,
      { def?: z.infer<typeof ChapterSchema>; nodes: StoryNode[] }
    >();

    for (const path of Object.keys(this.files).sort()) {
      if (WORLD_FILE.test(path)) {
        const world = this.parseSingle(path, WorldDefSchema);
        if (world) worlds.push(world);
      } else if (INTERLUDE_FILE.test(path)) {
        const file = this.parseSingle(path, InterludesFileSchema, 'interludes');
        for (const card of file?.interludes ?? []) {
          interludes.push(card);
          sources[sourceKey.interlude(card.id)] = path;
        }
      } else if (CHAPTER_FILE.test(path)) {
        const folder = CHAPTER_FILE.exec(path)![1]!;
        const def = this.parseSingle(path, ChapterSchema);
        if (def) {
          if (def.id !== folder)
            this.error(
              path,
              undefined,
              `chapter id "${def.id}" must match its folder name "${folder}"`,
            );
          sources[sourceKey.chapter(def.id)] = path;
          this.folder(chapterFolders, folder).def = def;
        }
      } else if (NODES_FILE.test(path)) {
        const folder = NODES_FILE.exec(path)![1]!;
        const file = this.parseSingle(path, NodesFileSchema, 'nodes');
        for (const node of file?.nodes ?? []) {
          this.folder(chapterFolders, folder).nodes.push(node);
          sources[sourceKey.node(folder, node.id)] = path;
        }
      }
    }

    for (const [folder, parts] of chapterFolders) {
      if (!parts.def) {
        this.error(
          `campaign/chapters/${folder}`,
          undefined,
          'folder has nodes but no chapter.json',
        );
        continue;
      }
      chapters[parts.def.id] = { def: parts.def, nodes: parts.nodes };
    }

    if (this.issues.length > 0 || !config || !resources || !characters || !difficulties)
      return undefined;
    if (!achievements || !factsAndTips || !campaign) return undefined;
    const data: ContentData = {
      config,
      resources,
      characters,
      worlds,
      difficulties,
      achievements,
      factsAndTips,
      campaign,
      chapters,
      interludes,
    };
    return { data, sources };
  }

  private folder(
    map: Map<string, { def?: z.infer<typeof ChapterSchema>; nodes: StoryNode[] }>,
    key: string,
  ) {
    let entry = map.get(key);
    if (!entry) {
      entry = { nodes: [] };
      map.set(key, entry);
    }
    return entry;
  }

  private parseSingle<S extends z.ZodType>(
    path: string,
    schema: S,
    listKey?: string,
  ): z.infer<S> | undefined {
    if (!(path in this.files)) {
      this.error(path, undefined, 'required content file is missing');
      return undefined;
    }
    const raw = this.files[path];
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      this.error(path, describeLocation(raw, issue.path, listKey), issue.message);
    }
    return undefined;
  }

  private error(file: string, location: string | undefined, message: string): void {
    this.issues.push({ severity: 'error', file, location, message });
  }
}

/** Builds a readable location such as `node "launch.fuelLeak" › left.days`. */
function describeLocation(raw: unknown, path: PropertyKey[], listKey?: string): string {
  const parts = path.map(String);
  if (listKey && parts[0] === listKey && parts.length > 1) {
    const list = (raw as Record<string, unknown>)[listKey];
    const item = Array.isArray(list)
      ? (list[Number(parts[1])] as { id?: string } | undefined)
      : undefined;
    const id = item?.id ? `"${item.id}"` : `#${parts[1]}`;
    return [`${listKey === 'nodes' ? 'node' : 'card'} ${id}`, ...parts.slice(2)].join(' › ');
  }
  return parts.join(' › ');
}
