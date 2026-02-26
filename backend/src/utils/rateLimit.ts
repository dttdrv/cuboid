import { IncomingMessage } from "node:http";
import { HttpError } from "./http.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  check(req: IncomingMessage, limit: number, windowMs: number): void {
    const ip = req.socket.remoteAddress || "unknown";
    const now = Date.now();

    let entry = this.limits.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.limits.set(ip, entry);
    }

    entry.count += 1;

    if (entry.count > limit) {
      throw new HttpError(429, "Too many requests. Please try again later.");
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(ip);
      }
    }
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
  }
}
