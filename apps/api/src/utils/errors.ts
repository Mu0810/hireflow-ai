/**
 * Typed HTTP errors.
 *
 * Services throw these instead of bare `Error`s so the transport layer can map a
 * failure to a meaningful status code.
 *
 * Previously every service failure surfaced as HTTP 400, which meant
 * "you are not a member of this company", "that job id does not exist" and
 * "your request body is malformed" were indistinguishable to a client. A client
 * could not tell a permissions problem from a typo, and could not decide whether
 * retrying, re-authenticating, or fixing the payload was the right response.
 *
 * `message` is always safe to send to the client — these are deliberate,
 * user-facing failures, not leaked internals. Anything that is *not* an
 * `AppError` is treated as unexpected and reported as a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    // Keep the throw site at the top of the stack rather than this constructor.
    Error.captureStackTrace?.(this, new.target);
  }
}

/** 400 — the request itself is malformed or semantically invalid. */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/** 401 — no valid credentials, or the credentials presented were rejected. */
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

/** 403 — authenticated, but not permitted to do this. */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

/** 404 — the addressed resource does not exist (or must not be revealed). */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/** 409 — conflicts with current state, e.g. a uniqueness or already-done rule. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
