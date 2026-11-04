/**
 * `npm run content:validate`: schema-validates every content file and checks the story graph.
 * Exits with code 1 when there are errors (warnings are printed but do not fail the run).
 */
import { ContentLoadError, ContentLoader, ContentValidator, formatIssue } from '@commander/engine';
import { readContentFiles } from './lib/read-content.js';

function main(): number {
  try {
    const { data, sources } = ContentLoader.load(readContentFiles());
    const report = new ContentValidator(data, sources).validate();
    report.warnings.forEach((issue) => console.warn(formatIssue(issue)));
    report.errors.forEach((issue) => console.error(formatIssue(issue)));
    const chapters = Object.keys(data.chapters).length;
    const nodes = Object.values(data.chapters).reduce((sum, c) => sum + c.nodes.length, 0);
    console.log(
      `\n${report.ok ? 'OK' : 'FAILED'}: ${chapters} chapters, ${nodes} story nodes, ${data.interludes.length} interludes, ` +
        `${report.errors.length} errors, ${report.warnings.length} warnings.`,
    );
    return report.ok ? 0 : 1;
  } catch (error) {
    if (error instanceof ContentLoadError) {
      error.issues.forEach((issue) => console.error(formatIssue(issue)));
      console.error(`\nFAILED: ${error.issues.length} schema errors.`);
    } else {
      console.error((error as Error).message);
    }
    return 1;
  }
}

process.exit(main());
