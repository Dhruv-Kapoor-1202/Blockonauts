# COMMANDER: Production Project Build Prompt (GitHub Copilot, Agent Mode)

> **How to use:** Put `Commander_Mission_Trainer_v2.html` in `./reference/` in an empty folder. Open the folder in VS Code, switch Copilot Chat to **Agent mode**, attach the file with `#file:reference/Commander_Mission_Trainer_v2.html`, and paste everything below the line.

---

## ROLE AND GOAL

You are a senior full-stack TypeScript engineer. Convert the attached single-file prototype `reference/Commander_Mission_Trainer_v2.html` into a **production-quality, maintainable monorepo** in the **current folder**.

When you are finished, these commands must work with no manual fixes:

```
npm install
npm run dev        # starts client + server together
npm test           # all tests pass
npm run lint       # no errors
npm run build      # all workspaces build
npm run content:validate
```

The game must keep **every feature, card, fact, character, and visual behaviour of the prototype** (see the Feature Parity Checklist), restructured into a **chapter-based branching narrative**.

Work in phases (see EXECUTION PLAN). After each phase, run the relevant build, tests, and lint, and fix any failures before you continue. Do not leave TODOs, stubs, placeholder logic, or `any` types.

---

## 1. TECH STACK (fixed, do not substitute)

| Area       | Choice                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| Language   | TypeScript (strict mode) everywhere                                         |
| Monorepo   | npm workspaces                                                              |
| Frontend   | React 18+, Vite, **Tailwind CSS v4** (`@tailwindcss/vite`)                  |
| Backend    | Node.js 20+, Express                                                        |
| Validation | Zod (shared schemas)                                                        |
| Tests      | Vitest (engine, client, server), React Testing Library, Supertest           |
| Quality    | ESLint (typescript-eslint, react-hooks), Prettier, EditorConfig             |
| Dev runner | `concurrently` (client + server), `tsx` for server dev                      |
| Fonts      | `@fontsource/*`, bundled locally (no Google Fonts CDN, so it works offline) |

---

## 2. FOLDER STRUCTURE

```
/
├─ package.json                 # workspaces + root scripts
├─ tsconfig.base.json
├─ .eslintrc / eslint.config.js, .prettierrc, .editorconfig, .gitignore
├─ README.md                    # setup, scripts, architecture overview, diagrams
├─ docs/
│  ├─ ARCHITECTURE.md           # layers, patterns, data flow (Mermaid diagrams)
│  ├─ STORY_AUTHORING.md        # how teammates add chapters/nodes/cards
│  └─ THEMING.md                # how to add or modify a UI theme
├─ reference/Commander_Mission_Trainer_v2.html   # untouched original
├─ content/                     # ALL story data (JSON), no code
│  ├─ schema/                   # generated JSON Schemas for VS Code autocomplete
│  ├─ characters.json
│  ├─ resources.json
│  ├─ worlds/moon.json, mars.json
│  ├─ difficulties.json
│  ├─ achievements.json
│  ├─ facts-and-tips.json       # death texts, ARIA tips, random events
│  └─ campaign/
│     ├─ campaign.json          # ordered chapter list per world
│     └─ chapters/<chapter-id>/
│        ├─ chapter.json        # metadata, start node, endings, interludes
│        └─ nodes/*.json        # story nodes, one file per storyline branch
│     └─ interludes/*.json      # reusable side-cards (the v2 deck)
├─ packages/
│  └─ engine/                   # pure TS game engine, NO React, NO DOM, NO Express
│     ├─ src/
│     │  ├─ domain/             # entities & value objects
│     │  ├─ narrative/          # chapter graph, node resolution, conditions
│     │  ├─ systems/            # resources, clock, scheduling, achievements, scoring
│     │  ├─ worlds/             # World strategy implementations
│     │  ├─ content/            # Zod schemas, loader, validator, graph tools
│     │  ├─ events/             # typed event bus
│     │  ├─ random/             # seeded RNG
│     │  └─ index.ts            # public API only
│     └─ test/
├─ server/
│  ├─ src/
│  │  ├─ app.ts                 # express app factory (testable, no listen)
│  │  ├─ server.ts              # entry point, listen
│  │  ├─ config/                # env config (typed, validated)
│  │  ├─ composition-root.ts    # the ONLY place concrete repos are chosen
│  │  ├─ routes/  controllers/  services/
│  │  ├─ repositories/
│  │  │  ├─ interfaces/         # IProgressRepository, ILeaderboardRepository, IContentSource
│  │  │  ├─ json-file/          # default implementation (data/*.json)
│  │  │  └─ in-memory/          # used by tests
│  │  ├─ middleware/            # error handler, request validation, not-found
│  │  └─ errors/                # typed AppError hierarchy
│  └─ test/
├─ client/
│  ├─ src/
│  │  ├─ app/                   # App, providers, router (screen state machine)
│  │  ├─ api/                   # typed API client (fetch wrapper)
│  │  ├─ game/                  # useGameSession hook, engine ↔ React adapter
│  │  ├─ components/            # presentational components (no game logic)
│  │  ├─ screens/               # Landing, Select, ChapterIntro, Game, ChapterResult, MissionReport
│  │  ├─ themes/
│  │  │  ├─ types.ts            # ThemeDefinition interface
│  │  │  ├─ registry.ts         # single list of available themes
│  │  │  ├─ ThemeProvider.tsx
│  │  │  ├─ neo-brutalist/      # tokens.css, theme.ts, portraits.tsx
│  │  │  ├─ minimal/
│  │  │  └─ holo-hud/
│  │  ├─ styles/index.css       # Tailwind entry + @theme mapping to CSS vars
│  │  └─ main.tsx
│  └─ test/
└─ scripts/                     # content:validate, content:graph, content:schema
```

---

## 3. ARCHITECTURE PRINCIPLES (must follow)

- **SOLID, object-oriented, layered.** Each class has a single responsibility. Depend on interfaces, not concrete classes. Use constructor injection.
- **The engine is pure.** `packages/engine` has zero dependencies on React, the DOM, Express, `Math.random`, `Date.now`, or `localStorage`. Time and randomness are injected.
- **Patterns to use (and name in TSDoc):**
  - **Strategy:** `World` interface → `MoonWorld` (14/14 day-night cycle, lunar-night heating drain, night-warning card injection), `MarsWorld` (dust storms, comms delay chip, storm card injection). Adding a world means adding one class and one JSON file.
  - **Observer:** typed `EventBus<GameEvent>`. The engine emits `ResourceChanged`, `DayAdvanced`, `StickerRaised`, `FactLogged`, `NodePresented`, `ChapterEnded`, `MissionEnded`, `AchievementUnlocked`, `PhaseChanged` (night/storm). React subscribes; the engine never calls UI code.
  - **Repository:** all persistence goes through interfaces.
  - **Factory:** `GameSessionFactory`, `RepositoryFactory`.
  - **Command:** each player choice is a `ChoiceCommand`, so runs can be replayed for server-side score verification and tests.
  - **Memento:** `SessionSnapshot` for save/resume and chapter checkpoints.
- **Deterministic:** seeded RNG (e.g. mulberry32). The same seed + same choices = the same run.
- **Documentation:** TSDoc on every exported class, interface, method, and type. Short "why" comments on non-obvious logic. Every module starts with a one-paragraph header comment explaining its purpose.
- **Style:** small files (aim for under ~200 lines), descriptive names, no magic numbers (move tuning values to content/config), no default exports except React components where idiomatic.

---

## 4. NARRATIVE SYSTEM (core requirement)

The prototype is a random deck. The new game is a **campaign of chapters**. Each chapter is a **branching decision tree**: every node is a card with two choices (left/right), and **each choice moves the story down a different branch**. Decisions must have real narrative consequences, not just resource deltas.

### 4.1 Campaign structure

`campaign.json` defines the ordered chapters for each world. Shared chapters can appear in both worlds.

```
PROLOGUE (shared)      → Ch.0 "Launch Day"        (Earth: loading, testing, liftoff)
MOON  path             → Ch.1 "Translunar"  → Ch.2 "Touchdown" → Ch.3 "Long Night" (survival)
MARS  path             → Ch.1 "The Long Cruise" → Ch.2 "Seven Minutes of Terror" → Ch.3 "Red Winter" (survival)
EPILOGUE (per world)   → "Crew Rotation" (Moon) / "Return Window" (Mars)
```

### 4.2 Chapter definition (`chapter.json`)

Each chapter has a **defined start node**, a **chapter goal** (text), and **explicitly declared endings**:

```jsonc
{
  "$schema": "../../../schema/chapter.schema.json",
  "id": "ch0-launch-day",
  "title": "Launch Day",
  "worlds": ["moon", "mars"],
  "goal": "Load the ship correctly and lift off.",
  "startNode": "launch.briefing",
  "clock": { "startDay": -3, "unitOverride": "day" }, // optional
  "endings": {
    "launch.liftoff": {
      "outcome": "advance",
      "title": "LIFTOFF",
      "text": "...",
      "setFlags": ["cleanLaunch"],
    },
    "launch.scrubbed": { "outcome": "retry", "title": "LAUNCH SCRUBBED", "text": "..." },
    "launch.explosion": {
      "outcome": "retry",
      "title": "VEHICLE LOST",
      "text": "...",
      "lesson": "Leak checks exist for a reason.",
    },
    "launch.limpingAlong": {
      "outcome": "advance",
      "title": "LIFTOFF... BARELY",
      "text": "...",
      "setFlags": ["damagedHull"],
      "carryEffects": { "R": -10 },
    },
  },
  "resourceFailure": { "outcome": "retry", "title": "SYSTEMS COLLAPSED" },
  "interludes": null, // or { "pools": ["colony","moon"], "every": [2,4], "untilDay": 84 }
}
```

- **Outcomes:** `advance` (go to the next chapter, keeping state and flags), `retry` (restore the chapter-start checkpoint and replay the chapter; show the ending and its lesson first), `missionEnd` (final win or loss → mission report).
- A chapter **must** have at least one `advance` ending (or `missionEnd` win for the last chapter).
- **Resource hits zero** during a chapter → the chapter's `resourceFailure` ending fires (uses the prototype's DEATH texts per resource as the body).
- **Retries** are counted per chapter and reduce the score. Difficulty controls the retry limit (`cadet`: unlimited, `commander`: 3 per chapter, `veteran`: 1). Running out of retries ends the mission with the mission report.

### 4.3 Story nodes (`nodes/*.json`)

One file = one storyline branch (e.g. `nodes/fuel-loading.json`), so teammates rarely touch the same file.

```jsonc
{
  "$schema": "../../../../schema/nodes.schema.json",
  "nodes": [
    {
      "id": "launch.fuelLeak",
      "speaker": "eng",
      "tag": "LAUNCH",
      "text": "Sensors show a tiny pressure drop in the oxidizer line. Full leak test costs a {D}.",
      "variants": [
        // optional: conditional text, first match wins
        {
          "when": { "flags": ["damagedHull"] },
          "text": "Another pressure drop. After last time, I don't like it.",
        },
      ],
      "fact": "Many launch scrubs are caused by sensor readings or small leaks.",
      "left": {
        "label": "Launch anyway",
        "days": 0,
        "effects": { "M": 4 },
        "setFlags": ["skippedLeakTest"],
        "goto": "launch.countdown",
      },
      "right": {
        "label": "Run the test",
        "days": 1,
        "effects": { "P": -4, "M": -3 },
        "goto": "launch.leakFound",
      },
    },
  ],
}
```

**Choice fields:** `label`, `days` (default 1, can be `{moon, mars}`), `effects`, `setFlags`, `clearFlags`, `gamble` (prototype `ch`: `p`, `win`, `lose`, `winText`, `loseText`, `winGoto`, `loseGoto`), `later` (delayed effect: `in`, `effects`, `message`), `sci: true`, and **`goto`**.

**`goto` forms:**

- `"node.id"`: the next node
- `"ending.id"`: ends the chapter
- conditional array, first match wins: `[{ "when": { "flags": ["skippedLeakTest"] }, "to": "launch.explosion" }, { "to": "launch.liftoff" }]`
- for gambles, `winGoto` / `loseGoto` override `goto`

**Conditions (`when`)**, used by `variants`, `goto`, and interlude eligibility. All fields are optional and AND-ed:
`flags` (all must be set), `notFlags`, `anyFlags`, `world`, `minDay`/`maxDay`, `resourceAbove` / `resourceBelow` (e.g. `{ "W": 30 }`), `chapterRetries` (≥).

**Overlap and merges:** branches may converge on a shared node (the graph is a DAG, not strictly a tree). Use flags + `variants` so a merged node still reflects the path taken. **Delayed consequences across chapters are first-class**: a flag set in Chapter 0 (e.g. `skippedLeakTest`, `packedExtraFood`) can change goto targets, text variants, or interlude eligibility in later chapters. Each chapter must include at least one decision whose consequence surfaces **later** (in a later node or chapter), not immediately.

**Design rule for content:** every node's two options must lead to meaningfully different branches or consequences (different next node, different flags, or a different ending). Never two options that produce the same result.

### 4.4 Interludes (keeps the prototype's survival gameplay)

Survival chapters (Ch.3) set `interludes`: between story nodes, the engine draws 2–4 side-cards from tagged pools using the prototype's `pick()` logic (recent-card memory, 35% bias toward cards that help the lowest resource, world filter, injected night/storm cards, `next` follow-ups, `winNext`). **All prototype cards in `CARDS` must be migrated into `content/campaign/interludes/*.json`** with original text, effects, days, gambles, `later`, `next`, facts, and moon/mars variants preserved. Interludes can also have `when` conditions and `setFlags`. The survival chapter's advance ending fires when the world goal day is reached (Moon Day 84, Mars Sol 100), which is the prototype's win condition.

### 4.5 Starter content (author it, fully playable)

- **Ch.0 Launch Day (shared):** depth of at least 5 decisions, at least 10 nodes, endings: clean liftoff, damaged liftoff, scrub (retry), explosion (retry). Topics: cargo loadout trade-offs (food vs. spares vs. science), leak test, weather hold, crew fatigue, comms check. Use prototype characters.
- **Ch.1 and Ch.2 per world:** at least 8 nodes each, at least 3 endings each, realistic NASA-grounded facts (transit radiation, course correction, landing site choice, EDL for Mars, landing hazards for Moon). Flags from Ch.0 must change at least 2 nodes here.
- **Ch.3 survival per world:** short story spine (at least 6 nodes) with interludes from the migrated deck, ending at the goal day.
- **Epilogue per world:** 3–4 nodes reflecting key flags, leading to the `missionEnd` win.
- Keep the prototype's tone: short card text (1–2 sentences), kid-friendly, factual, with a `fact` on every node.

### 4.6 Content tooling (`scripts/`)

- `npm run content:validate`: Zod-validates all JSON and checks the graph. Fail with clear file + node id messages for: unknown speaker / resource key / node / ending / flag typo (flag read but never set anywhere = warning), duplicate ids, unreachable nodes, nodes with no path to any ending, cycles without a day-consuming choice, a chapter with no advance ending, and campaign references to missing chapters.
- `npm run content:graph`: writes `docs/graphs/<chapter>.md` with a **Mermaid flowchart** of every chapter (nodes, left/right labels, endings coloured by outcome), so the team can review story trees visually.
- `npm run content:schema`: generates JSON Schemas from the Zod schemas into `content/schema/` (VS Code autocomplete via `$schema`).
- Content is loaded by the server through `IContentSource` (default: `FileSystemContentSource`) and served to the client at `/api/content` as one validated bundle. Adding a node file requires **no code change**.

---

## 5. ENGINE CLASSES (minimum set)

`GameSession` (orchestrator, public API: `start`, `choose(side)`, `preview(side)`, `snapshot`, `restore`, `askAria`), `Campaign`, `ChapterRunner`, `NodeResolver` (variants + goto), `ConditionEvaluator`, `FlagSet`, `ResourcePool`, `MissionClock`, `World` (+ `MoonWorld`, `MarsWorld`), `EffectResolver` (immediate + gamble), `ScheduledEffectQueue` (`later`), `InterludeSelector`, `SupplySchedule`, `RandomEventTable`, `AchievementTracker`, `ScoreCalculator` (prototype formula + chapter retry penalty + chapters cleared bonus), `AriaAdvisor` (prototype tip logic), `TextTemplater` (`{D}`, `{Ds}`, `{P}`, `{nightIn}`), `SeededRandom`, `EventBus`, `ContentBundle`, `ContentValidator`, `ChapterGraph`.

The prototype's daily tick rules must be preserved exactly: world drain × difficulty multiplier, Moon night extra power drain / day gain, Mars storm drain, the −0.8 health penalty per resource below 20, supply drops on the world schedule, pending effects, random events (8% after day 4), and clamping to 0–100.

---

## 6. SERVER API

Base `/api`. Validate all inputs with Zod middleware. Consistent error shape `{ error: { code, message } }`. CORS for the Vite dev origin. Add a `/api/health` endpoint.

| Method | Route                                  | Purpose                                                                                                                                                                           |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/content`                         | Validated content bundle (cached in memory)                                                                                                                                       |
| POST   | `/api/players`                         | Register `{ callsign }` → `{ playerId }`                                                                                                                                          |
| GET    | `/api/progress/:playerId`              | List saved runs                                                                                                                                                                   |
| PUT    | `/api/progress/:playerId/:runId`       | Save a `SessionSnapshot` (autosave after every choice and chapter end)                                                                                                            |
| DELETE | `/api/progress/:playerId/:runId`       | Delete a run                                                                                                                                                                      |
| GET    | `/api/leaderboard?world=moon&limit=10` | Shared leaderboard                                                                                                                                                                |
| POST   | `/api/leaderboard`                     | Submit `{ playerId, runId, seed, world, difficulty, commands[] }`. **The server replays the commands with the engine** and computes the score itself (no trusting client scores). |

**Persistence:** `IProgressRepository`, `ILeaderboardRepository`, `IPlayerRepository` (all async, return domain types). Implementations: `JsonFile*Repository` (writes to `server/data/*.json` with atomic write: temp file + rename; `data/` is gitignored), and `InMemory*Repository` for tests. `composition-root.ts` picks the implementation from `STORAGE_DRIVER=json|memory`. Document in ARCHITECTURE.md exactly how to add a `Cosmos`/`Sql` driver (one class + one switch case).

**Client offline fallback:** if the API is unreachable, the client still plays using content bundled at build time and saves progress to `localStorage` through the same client-side `ProgressStore` interface. Show a small "offline" chip.

---

## 7. UI AND THEMING (swappable)

### 7.1 Rules

- Use **Tailwind utility classes**, but **every colour, font, border width, radius, shadow, and motion value comes from CSS variables** (design tokens). No hardcoded hex values or font names in components.
- `styles/index.css` maps tokens into Tailwind v4 `@theme` (e.g. `--color-surface: var(--t-surface)`, so `bg-surface`, `text-ink`, `border-ink`, `shadow-hard`, `font-display` all work).
- **Common component styling is centralized** in each theme's `ThemeDefinition.classes` recipe object, e.g.:

```ts
export interface ThemeDefinition {
  id: string;
  name: string;
  tokensClass: string; // e.g. "theme-neo" applied on <html>, defines all --t-* vars
  worldTokens: Record<WorldId, string>; // per-world accent overrides (moon cyan, mars orange)
  classes: {
    // Tailwind class recipes used by shared components
    panel: string;
    button: { primary: string; secondary: string };
    card: {
      root: string;
      art: string;
      body: string;
      plate: string;
      stamp: { left: string; right: string };
    };
    option: string;
    chip: string;
    sticker: Record<'neutral' | 'good' | 'bad' | 'time', string>;
    resource: {
      root: string;
      bar: string;
      fill: string;
      ghost: string;
      pop: { up: string; down: string };
    };
    notes: string;
    timeline: string;
    heading: string;
    label: string;
  };
  Portrait: React.FC<{ character: Character }>; // theme-specific character art
  Background: React.FC<{ world: WorldId; phase: Phase }>; // stars/planet/veils
  motion: { cardDealMs: number; flyOutMs: number; stickerMs: number };
}
```

- Components (`Card`, `OptionButton`, `ResourceBar`, `Sticker`, `TimelineStrip`, `FieldNotes`, `Panel`, `Button`, `Chip`) read recipes via `useTheme()`. **They never branch on theme id.**
- Switch themes via a settings menu (gear icon) and `?theme=<id>`; persist the choice in `localStorage`. Adding a theme = add a folder + one line in `registry.ts`. Document this in THEMING.md.

### 7.2 Themes to ship

1. **`neo-brutalist`:** a faithful port of the prototype (thick ink borders, hard offset shadows, Archivo Black / Space Mono / Silkscreen / Space Grotesk, grain overlay, halftone dots, rotated plates and stamps, the pixel planet, per-world accents). It must look the same as the prototype.
2. **`minimal`:** a clean light/dark-aware UI: Inter, soft neutrals, 1px hairline borders, generous whitespace, rounded-xl corners, subtle shadows, no grain, flat simple portraits (initials avatar in an accent circle), restrained motion.
3. **`holo-hud`:** a sci-fi spacecraft HUD: dark glass panels (`backdrop-blur`, translucent fills), cyan/magenta neon glows, thin angled corner brackets, monospace telemetry type (e.g. JetBrains Mono + Orbitron), scanline overlay, glowing resource gauges, holographic-silhouette portraits.

All three must support the full game, mobile and desktop layouts, and `prefers-reduced-motion`.

### 7.3 Screens

`Landing` → `WorldSelect` (world + difficulty, as in the prototype) → `ChapterIntro` (chapter number, title, goal, retry count) → `Game` → `ChapterResult` (ending title, text, lesson, outcome: Continue / Retry chapter) → … → `MissionReport` (prototype report + chapters cleared, retries, key decisions made from flags, shared leaderboard). Landing shows **Continue** if a saved run exists. Implement screen flow as a small typed state machine, not ad-hoc booleans.

### 7.4 Layout

Keep the prototype's responsive grid exactly: mobile single column (time → resources → card stage → options → notes); desktop ≥980px three columns (resources | stage + options | time + notes). Add a small **chapter header** (chapter number, title, goal progress) inside the time panel.

---

## 8. FEATURE PARITY CHECKLIST (all required, verify each one at the end)

- [ ] Callsign entry (max 12 chars, uppercase, Enter submits), world select, 3 difficulties with prototype multipliers and Cadet ▲▼ hints
- [ ] All 7 resources with icons, colours, start values, drain rates per world
- [ ] Card drag with pointer capture, rotation, threshold `min(110, width*0.28)`, snap-back, fly-out animation
- [ ] Left/right stamps fading with drag distance; option buttons highlight; hover/focus preview
- [ ] Keyboard: ArrowLeft/A and ArrowRight/D; visible focus styles; aria labels; `aria-live` notes
- [ ] Effect preview dots (size for |Δ| ≥ 10, `?` for gamble/delayed, colour only on Cadet)
- [ ] `T+N DAYS/SOLS` / `NO TIME` duration badges and the `+N` preview badge on the day counter
- [ ] Resource bars with ghost bar (drain trail / gain flash), animated count, low (<35) / critical (<20) states, shake, `+N/−N` pop
- [ ] Day counter flip animation; chips (night/dawn, lander/ship ETA, storm, comms delay, goal countdown)
- [ ] Timeline strip (Moon 28-day lit/dark cycle; Mars rolling 24-sol window with storms; supply markers)
- [ ] Night veil and storm veil on the background; Moon/Mars planet and satellite visuals per world
- [ ] Stickers queue (gamble results, multi-day "N days pass…", supply landed, delayed effects, night/sunrise, storm start/clear)
- [ ] ARIA button with tips, odds hint on Cadet, alert pulse when any resource < 25, auto-hide after 6s
- [ ] Field notes: unique facts, newest first, max 4, desktop fade
- [ ] Gambles, delayed `later` effects, `next` follow-ups, `winNext`, injected `m_night` / `r_storm`
- [ ] Supply drops on schedule, random events, achievements (all 8), score formula, mission report
- [ ] Leaderboard (now shared via the server)
- [ ] Ticker on the landing page, credit line, "◀ DRAG ▶" hint on the first 2 cards
- [ ] `?fast` mode (all delays 0) and dev-only debug hook `window.__g` (`S`, `choose`, `start`, `setMode`, `setDiff`), stripped in production builds
- [ ] HTML escaping of user input (callsign) everywhere

---

## 9. TESTS (clean, meaningful, no snapshot spam)

- **Engine (Vitest):** resource clamping, daily tick math per world + difficulty, Moon night cycle, Mars storm, scheduled effects timing, gamble with a seeded RNG, `NodeResolver` goto/variant/condition precedence, chapter advance/retry/missionEnd, checkpoint restore, retry limits, interlude selection bias, achievements, score, and **full deterministic replay** (same seed + commands → same score).
- **Content:** `ContentValidator` catches each error type using small fixtures; the real `content/` folder passes validation; every chapter has a reachable advance ending.
- **Server (Supertest + in-memory repos):** each route happy path + validation errors; leaderboard rejects tampered scores (server replay).
- **Client (RTL):** theme switching applies recipes without re-mounting the game; option button click advances the node; keyboard controls; Continue appears when a save exists.
- Coverage target of at least 80% on `packages/engine`.

---

## 10. DOCUMENTATION

- **README.md:** what COMMANDER is, prerequisites, quick start, all scripts, folder map, how to switch themes, how to add story content (link), and the tech decisions.
- **docs/STORY_AUTHORING.md:** written for teammates who are not engine developers. Cover the chapter/node/ending model with a diagram, a copy-paste node template, the `goto`/`when`/flags reference, delayed consequences, merging branches safely, the rules (two meaningfully different options, a fact on every node, short text), a naming convention (`<chapter>.<storyline>.<beat>`, flags in camelCase), the workflow (create a file → `content:validate` → `content:graph` → PR), and common validator errors with fixes.
- **docs/THEMING.md:** the token list, the recipe object, and a step-by-step guide for adding a theme.
- **docs/ARCHITECTURE.md:** layers, patterns used and where, engine event flow, persistence swap guide, and the save/replay model.

---

## 11. EXECUTION PLAN

1. Scaffold the workspaces, tooling, configs, and root scripts. Verify that `npm install` and `npm run lint` work.
2. Engine: domain, systems, worlds, narrative, content schemas + validator, plus tests. Make the tests pass.
3. Content: migrate all prototype data (resources, characters, worlds, difficulties, deaths, tips, achievements, events, every card as interludes). Author the campaign chapters. Make `content:validate` pass, then generate schemas and graphs.
4. Server: repositories, services, routes, composition root, plus tests.
5. Client: themes (neo-brutalist first, matching the prototype), components, screens, the game adapter hook, the API client, and offline fallback, plus tests.
6. Add the minimal and holo-hud themes.
7. Write the docs.
8. Final verification: run every script in the GOAL section, walk through the Feature Parity Checklist and confirm each item in code, then play through Ch.0 on both outcomes (advance and retry) using `?fast`. Report a short summary of what was built and any deviations, with justification.
