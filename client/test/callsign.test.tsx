/**
 * Callsign sanitising and escaping: input is reduced to a safe upper-case string of at most 12
 * characters, and hostile text is rendered as plain text, never as markup.
 */
import type { GameView } from '@commander/engine';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { callsignOrDefault, filterCallsignInput, sanitizeCallsign } from '../src/app/callsign';
import { MissionReportScreen } from '../src/screens/MissionReportScreen';
import { ThemeProvider } from '../src/themes/ThemeProvider';

describe('callsign sanitising', () => {
  it('upper-cases, trims and limits to 12 characters', () => {
    expect(sanitizeCallsign('  ada lovelace-x1  ')).toBe('ADA LOVELACE');
    expect(sanitizeCallsign('x'.repeat(40))).toHaveLength(12);
  });

  it('strips markup and unusual characters', () => {
    expect(sanitizeCallsign('<img src=x onerror=alert(1)>')).toBe('IMG SRCX ONE');
    expect(filterCallsignInput('a<b>"c\'&')).toBe('ABC');
  });

  it('falls back to COMMANDER when nothing usable is left', () => {
    expect(callsignOrDefault('   ')).toBe('COMMANDER');
    expect(callsignOrDefault('<<>>')).toBe('COMMANDER');
  });
});

describe('escaping of player text', () => {
  it('renders a hostile callsign on the report as text, not as an element', () => {
    const report = {
      result: 'win',
      title: 'HOME',
      text: 'Done.',
      worldId: 'moon',
      worldName: 'ARTEMIS BASE',
      day: 10,
      unitsLabel: 'days',
      score: 1,
      factsLogged: 0,
      learned: [],
      achievements: [],
      chaptersCleared: 1,
      chaptersTotal: 1,
      retries: 0,
      keyDecisions: [],
    };
    const view = { report } as unknown as GameView;
    const hostile = '<img src=x onerror=alert(1)>';
    const { container } = render(
      <ThemeProvider>
        <MissionReportScreen
          view={view}
          callsign={hostile}
          achievements={[]}
          leaderboard={{ status: 'idle' }}
          onSwitchRock={() => undefined}
          onFlyAgain={() => undefined}
        />
      </ThemeProvider>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(new RegExp(hostile.replace(/[()]/g, '\\$&')))).toBeInTheDocument();
  });
});
