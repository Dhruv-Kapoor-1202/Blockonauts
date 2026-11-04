/**
 * Error raised when a command is not valid in the current state, or content breaks a runtime
 * invariant (e.g. a goto that points nowhere). Content that passes `content:validate` never
 * triggers the latter.
 */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}
