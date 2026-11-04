/**
 * ContentBundle: the single validated, read-only content package the engine and client consume.
 * It is JSON-serialisable (`toJSON`) so the server can ship it to the browser as one payload.
 */
import type { WorldId } from '../domain/ids.js';
import type {
  AchievementDef,
  CampaignDef,
  ChapterDef,
  CharacterDef,
  DifficultyDef,
  FactsAndTips,
  GameConfig,
  Interlude,
  ResourceDef,
  StoryNode,
  WorldDef,
} from './schemas/index.js';

/** A chapter definition together with all of its story nodes. */
export interface ChapterContent {
  def: ChapterDef;
  nodes: StoryNode[];
}

/** Plain-data form of the bundle (what travels over HTTP). */
export interface ContentData {
  config: GameConfig;
  resources: ResourceDef[];
  characters: CharacterDef[];
  worlds: WorldDef[];
  difficulties: DifficultyDef[];
  achievements: AchievementDef[];
  factsAndTips: FactsAndTips;
  campaign: CampaignDef;
  chapters: Record<string, ChapterContent>;
  interludes: Interlude[];
}

/** Indexed, read-only view over {@link ContentData}. */
export class ContentBundle {
  private readonly characterIndex: Map<string, CharacterDef>;
  private readonly interludeIndex: Map<string, Interlude>;
  private readonly nodeIndex = new Map<string, Map<string, StoryNode>>();

  /** @param data validated content. */
  constructor(readonly data: ContentData) {
    this.characterIndex = new Map(data.characters.map((c) => [c.id, c]));
    this.interludeIndex = new Map(data.interludes.map((c) => [c.id, c]));
    for (const [id, chapter] of Object.entries(data.chapters)) {
      this.nodeIndex.set(id, new Map(chapter.nodes.map((n) => [n.id, n])));
    }
  }

  /** Rebuilds a bundle from its JSON form. */
  static fromJSON(data: ContentData): ContentBundle {
    return new ContentBundle(data);
  }

  /** Returns the plain data (safe to JSON.stringify). */
  toJSON(): ContentData {
    return this.data;
  }

  get config(): GameConfig {
    return this.data.config;
  }

  /** @throws Error when the world is unknown. */
  world(id: WorldId): WorldDef {
    const world = this.data.worlds.find((w) => w.id === id);
    if (!world) throw new Error(`Unknown world "${id}"`);
    return world;
  }

  /** @throws Error when the difficulty is unknown. */
  difficulty(id: string): DifficultyDef {
    const difficulty = this.data.difficulties.find((d) => d.id === id);
    if (!difficulty) throw new Error(`Unknown difficulty "${id}"`);
    return difficulty;
  }

  /** Looks up a character by id. */
  character(id: string): CharacterDef | undefined {
    return this.characterIndex.get(id);
  }

  /** Looks up an interlude card by id. */
  interlude(id: string): Interlude | undefined {
    return this.interludeIndex.get(id);
  }

  /** @throws Error when the chapter is unknown. */
  chapter(id: string): ChapterContent {
    const chapter = this.data.chapters[id];
    if (!chapter) throw new Error(`Unknown chapter "${id}"`);
    return chapter;
  }

  /** Looks up a story node within a chapter. */
  node(chapterId: string, nodeId: string): StoryNode | undefined {
    return this.nodeIndex.get(chapterId)?.get(nodeId);
  }

  /** Ordered chapter ids for a world. @throws Error when the world has no sequence. */
  sequence(world: WorldId): string[] {
    const sequence = this.data.campaign.sequences[world];
    if (!sequence) throw new Error(`No campaign sequence for world "${world}"`);
    return sequence;
  }
}
