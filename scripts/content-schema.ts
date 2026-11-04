/**
 * `npm run content:schema`: generates JSON Schemas from the engine's Zod schemas into
 * `content/schema/` so VS Code offers autocomplete via each file's `$schema` pointer.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
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
} from '@commander/engine';
import { contentDir } from './lib/read-content.js';

const schemas: Record<string, z.ZodType> = {
  config: ConfigSchema,
  resources: ResourcesFileSchema,
  characters: CharactersFileSchema,
  difficulties: DifficultiesFileSchema,
  achievements: AchievementsFileSchema,
  'facts-and-tips': FactsAndTipsSchema,
  world: WorldDefSchema,
  campaign: CampaignSchema,
  chapter: ChapterSchema,
  nodes: NodesFileSchema,
  interludes: InterludesFileSchema,
};

const outDir = join(contentDir, 'schema');
mkdirSync(outDir, { recursive: true });
for (const [name, schema] of Object.entries(schemas)) {
  const json = z.toJSONSchema(schema, { target: 'draft-7', io: 'input', unrepresentable: 'any' });
  writeFileSync(join(outDir, `${name}.schema.json`), `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`Wrote ${Object.keys(schemas).length} schemas to content/schema/`);
