# @commander/client

React 19 + TypeScript (strict) + Vite + Tailwind CSS v4 front end of COMMANDER.

```
npm run dev       -w @commander/client   # http://localhost:5173, /api proxied to :3001
npm test          -w @commander/client   # Vitest + React Testing Library
npm run typecheck -w @commander/client
npm run build     -w @commander/client
```

Open `/?fast` to make every delay zero, `/?theme=<id>` to force a theme. In development
`window.__g` exposes `S` (current `GameView`), `choose('L'|'R')`, `start()`, `setMode(world)` and
`setDiff(difficulty)`; it is not part of production builds.

## Architecture

| Folder           | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`        | `App` (provider composition), `Stage` (current screen + chrome), the typed screen state machine (`screen-machine.ts`, a pure reducer), `AppServices` injection (`services.ts`, `default-services.ts` is the composition root), UI copy                                                                                                                                                                                     |
| `src/api`        | `ApiClient` interface + `FetchApiClient`, `ContentSource` (`ApiFirstContentSource`: API first, content bundled at build time as fallback), `PlayerRegistry`                                                                                                                                                                                                                                                                |
| `src/game`       | The engine <-> React adapter. `useGameSession` owns the `GameSession`; `playback-plan.ts` (pure) turns the events of one choice into paced presentation steps, `presented-state.ts` (pure) reduces them to what the UI shows; `ProgressStore` / `LeaderboardStore` interfaces with remote, local and resilient (offline fallback) implementations; `Connectivity` drives the OFFLINE chip; `Timing` makes `?fast` possible |
| `src/components` | Presentational components (Card, OptionButtons, ResourceList/Meter, TimePanel, TimelineStrip, FieldNotes, Sticker, ThemeMenu...). They contain no game rules and read recipes through `useTheme()`                                                                                                                                                                                                                         |
| `src/screens`    | Landing, WorldSelect, ChapterIntro, Game, ChapterResult, MissionReport                                                                                                                                                                                                                                                                                                                                                     |
| `src/themes`     | The theme system; see [`src/themes/README.md`](src/themes/README.md)                                                                                                                                                                                                                                                                                                                                                       |
| `src/styles`     | Tailwind entry (`index.css`: token -> `@theme inline` mapping) and shared keyframes                                                                                                                                                                                                                                                                                                                                        |
| `test`           | Unit and RTL tests; they use the engine's mini fixture and fake services, no network                                                                                                                                                                                                                                                                                                                                       |

### Data flow of a choice

1. The player drags, clicks or presses a key; `GameScreen` calls `controller.choose(side)`.
2. The hook subscribes to `session.events`, calls `session.choose(side)` (the engine resolves the
   whole turn synchronously) and collects the events.
3. The save is written (`ProgressStore`); on mission end the save is deleted and the run's inputs
   (seed + commands, never a score) go to the leaderboard.
4. `planChoice(events)` produces steps (wait, resource change, sticker, note, day tick, new card,
   exit...) with the prototype's timings; the hook plays them, applying each to the presented
   state. Input is locked meanwhile.
5. At the end the presented state is reconciled with `session.view()`, or the app moves to the
   chapter result / mission report screen.

### Offline

`/api/content` is requested with a short timeout; on any failure the content bundled by
`import.meta.glob('content/**/*.json')` is validated by `ContentLoader` and used instead. Saves and
the leaderboard fall back to `localStorage` (`commander.runs`, `commander.leaderboard`) through the
same interfaces, and the OFFLINE chip shows while the API is unreachable.
