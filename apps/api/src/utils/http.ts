import type { Response } from "express";
import { AppError } from "./errors";

/**
 * Send an error response from a controller.
 *
 * An `AppError` carries its own status code, so it is used directly. Anything
 * else keeps the previous behaviour: surface `error.message` if there is one,
 * otherwise the supplied fallback, at `defaultStatus`.
 *
 * `defaultStatus` exists because a few handlers had a more appropriate default
 * than 400 before typed errors were introduced (login failures defaulted to 401,
 * single-resource fetches to 404), and that behaviour is preserved.
 */
export function sendError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  defaultStatus = 400
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return res.status(defaultStatus).json({ error: message });
}
