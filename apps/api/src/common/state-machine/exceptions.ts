/**
 * Thrown when the requested (status → event) combination does not exist
 * in the transition map — i.e. the transition is not allowed from this state.
 */
export class InvalidTransitionException extends Error {
  constructor(currentStatus: string, event: string) {
    super(`Cannot apply event "${event}" when status is "${currentStatus}".`);
    this.name = 'InvalidTransitionException';
  }
}

/**
 * Thrown when the transition exists but the guard returned false —
 * the actor does not have permission to perform this action.
 */
export class ForbiddenTransitionException extends Error {
  constructor(currentStatus: string, event: string) {
    super(
      `Not allowed to apply event "${event}" on a "${currentStatus}" document.`,
    );
    this.name = 'ForbiddenTransitionException';
  }
}

/**
 * Thrown when the transition has a `requires` list and a required
 * payload field is missing or empty.
 */
export class MissingRequiredFieldException extends Error {
  constructor(field: string) {
    super(`Required field "${field}" is missing.`);
    this.name = 'MissingRequiredFieldException';
  }
}
