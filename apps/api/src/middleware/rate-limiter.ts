import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

export function rateLimiter(maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (env.NODE_ENV !== "production") {
      return next();
    }

    const key = req.ip || "anonymous";
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests, please try again later.",
      });
    }

    return next();
  };
}

export function authRateLimiter() {
  return rateLimiter(10, 15 * 60 * 1000);
}
