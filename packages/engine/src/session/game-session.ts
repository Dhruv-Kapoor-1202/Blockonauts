/**
 * GameSession: the engine's public façade. The UI (or a test, or the server's replay verifier)
 * drives a run through `start`, `choose`, `proceed`, `preview`, `askAria`, `snapshot` and
 * `restore`, and observes it through the typed `events` bus and `view()`.
 */
import { EngineError } from '../errors.js';
import type { ChoiceCommand } from '../domain/commands.js';
import type { GameEvent } from '../domain/events.js';
import type { Side } from '../domain/ids.js';
import type { SessionSnapshot } from '../domain/snapshot.js';
import type { ChoicePreview, GameView, SessionStatus } from '../domain/view.js';
import type { EventBus } from '../events/event-bus.js';
import type { ChapterFlow } from './chapter-flow.js';
import type { SessionContext } from './session-context.js';
import type { TurnProcessor } from './turn-processor.js';
import type { ViewBuilder } from './view-builder.js';

/** One playable run of the campaign. Create instances with `GameSessionFactory`. */
export class GameSession {
  private commands: ChoiceCommand[] = [];

  /** @internal Use `GameSessionFactory`. */
  constructor(
    private readonly ctx: SessionContext,
    private readonly flow: ChapterFlow,
    private readonly turns: TurnProcessor,
    private readonly views: ViewBuilder,
  ) {}

  /** Subscribe here to observe the run. */
  get events(): EventBus<GameEvent> {
    return this.ctx.services.bus;
  }

  get status(): SessionStatus {
    return this.ctx.state.status;
  }

  get seed(): number {
    return this.ctx.services.seed;
  }

  get worldId(): string {
    return this.ctx.worldDef.id;
  }

  get difficultyId(): string {
    return this.ctx.services.difficulty.id;
  }

  /** The commands issued so far (for replay and verification). */
  get commandLog(): readonly ChoiceCommand[] {
    return this.commands;
  }

  /** Begins the campaign at its first chapter. @throws EngineError if already started. */
  start(): void {
    if (this.ctx.state.status !== 'idle') throw new EngineError('The session has already started');
    const { state, worldDef } = this.ctx;
    state.resources.restore(worldDef.startResources);
    state.chapterIndex = 0;
    this.flow.startChapter(0, false);
  }

  /** Picks the left or right option of the current card. */
  choose(side: Side): void {
    this.turns.choose(side);
    this.commands.push({ kind: 'choose', side });
  }

  /** Leaves the chapter result screen (continue or retry, as the ending dictates). */
  proceed(): void {
    this.flow.proceed();
    this.commands.push({ kind: 'proceed' });
  }

  /** Applies a recorded command. */
  apply(command: ChoiceCommand): void {
    if (command.kind === 'choose') this.choose(command.side);
    else this.proceed();
  }

  /** Previews what an option would do without changing anything. */
  preview(side: Side): ChoicePreview {
    const card = this.views.card();
    return card[side];
  }

  /** ARIA's current advice. */
  askAria(): string {
    const { ctx } = this;
    const { services, state } = ctx;
    const { card } = ctx.currentCard();
    const gamble = (ctx.choiceOf(card, 'right').gamble ?? ctx.choiceOf(card, 'left').gamble)?.p;
    return services.aria.advise({
      resources: state.resources,
      phaseTip: services.world.ariaPhaseTip(state.clock.day, state.weather),
      unit: ctx.units().unit,
      hints: services.difficulty.hints,
      gambleChance: gamble,
      tipThreshold: services.bundle.config.thresholds.ariaTip,
    });
  }

  /** The complete state for rendering. */
  view(): GameView {
    return this.views.game();
  }

  /** Captures the whole run (Memento). */
  snapshot(): SessionSnapshot {
    const { state, services } = this.ctx;
    return {
      version: 1,
      seed: services.seed,
      worldId: this.worldId,
      difficultyId: this.difficultyId,
      callsign: services.callsign,
      commands: this.commands.map((command) => ({ ...command })),
      state: state.toState(services.rng.getState()),
      checkpoint: state.checkpoint,
    };
  }

  /** Restores a snapshot taken from a session with the same seed, world and difficulty. */
  restore(snapshot: SessionSnapshot): void {
    if (snapshot.worldId !== this.worldId || snapshot.difficultyId !== this.difficultyId) {
      throw new EngineError('Snapshot belongs to a different world or difficulty');
    }
    this.ctx.state.load(snapshot.state, snapshot.checkpoint);
    this.ctx.services.rng.setState(snapshot.state.rng);
    this.commands = snapshot.commands.map((command) => ({ ...command }));
  }
}
