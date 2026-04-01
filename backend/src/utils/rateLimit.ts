import { IncomingMessage } from "node:http";
import { HttpError } from "./http.js";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly hits = new Map<string, RateLimitEntry>();

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;

    // Cleanup every minute to prevent memory leaks
    setInterval(() => this.cleanup(), 60000).unref();
  }

  check(req: IncomingMessage): void {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim()
      : req.socket.remoteAddress || "unknown";

    const now = Date.now();

    let entry = this.hits.get(ip);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.hits.set(ip, entry);
    }

    entry.count += 1;
    if (entry.count > this.max) {
      throw new HttpError(429, "Too many requests, please try again later.");
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.hits.entries()) {
      if (now > entry.resetTime) {
        this.hits.delete(ip);
      }
    }
  }
}
