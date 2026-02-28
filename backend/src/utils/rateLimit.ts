export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number
  ) {
    this.cleanupInterval = setInterval(() => this.cleanup(), windowMs * 2);
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || now >= record.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    record.count++;
    return record.count > this.maxHits;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now >= record.resetAt) {
        this.hits.delete(key);
      }
    }
  }
}
