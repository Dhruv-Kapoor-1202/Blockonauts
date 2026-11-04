/**
 * Mermaid exporter: renders a chapter's graph as a flowchart so the team can review story
 * trees visually. Endings are coloured by outcome (advance green, retry amber, missionEnd blue).
 */
import { INTERLUDES_TARGET } from '../domain/ids.js';
import type { ChapterContent } from './bundle.js';
import { ChapterGraph } from './chapter-graph.js';

const OUTCOME_CLASS = { advance: 'advance', retry: 'retry', missionEnd: 'mission' } as const;

/** Makes text safe inside a Mermaid quoted label. */
function clean(text: string, max = 40): string {
  const flat = text
    .replace(/["\n\r]/g, ' ')
    .replace(/[<>]/g, '')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** Mermaid node ids may not contain dots, so map them to safe identifiers. */
function safeId(id: string): string {
  return `n_${id.replace(/[^A-Za-z0-9]/g, '_')}`;
}

/** @returns a Markdown document with one Mermaid flowchart for the chapter. */
export function chapterToMermaid(chapter: ChapterContent): string {
  const graph = new ChapterGraph(chapter);
  const { def } = chapter;
  const lines: string[] = ['flowchart TD'];
  for (const node of chapter.nodes) {
    const marker = node.id === def.startNode ? '((START)) ' : '';
    lines.push(`  ${safeId(node.id)}["${marker}${clean(node.id)}<br/>${clean(node.speaker)}"]`);
  }
  for (const [id, ending] of Object.entries(def.endings)) {
    lines.push(
      `  ${safeId(id)}(["${clean(ending.title)}<br/>${ending.outcome}"]):::${OUTCOME_CLASS[ending.outcome]}`,
    );
  }
  if (def.interludes) lines.push(`  ${safeId(INTERLUDES_TARGET)}{{"survival interludes"}}`);
  for (const edge of graph.edges) {
    const arrow = edge.side === 'left' ? '←' : '→';
    const note = edge.note ? ` [${clean(edge.note, 30)}]` : '';
    lines.push(
      `  ${safeId(edge.from)} -->|"${arrow} ${clean(edge.label, 28)}${note}"| ${safeId(edge.to)}`,
    );
  }
  lines.push('  classDef advance fill:#7ae582,stroke:#000,color:#000;');
  lines.push('  classDef retry fill:#ffb020,stroke:#000,color:#000;');
  lines.push('  classDef mission fill:#4cc9f0,stroke:#000,color:#000;');
  const header = `# ${def.title} (\`${def.id}\`)\n\n> ${def.goal}\n\nWorlds: ${def.worlds.join(', ')}\n`;
  return `${header}\n\`\`\`mermaid\n${lines.join('\n')}\n\`\`\`\n`;
}
