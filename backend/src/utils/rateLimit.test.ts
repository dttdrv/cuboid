import { describe, it, expect } from "vitest";
import { IncomingMessage } from "node:http";
import { RateLimiter } from "./rateLimit.js";
import { HttpError } from "./http.js";

function createMockRequest(ip: string): IncomingMessage {
  return {
    socket: {
      remoteAddress: ip,
    },
  } as unknown as IncomingMessage;
}

describe("RateLimiter", () => {
  it("should allow requests within the limit", () => {
    const limiter = new RateLimiter();
    const req = createMockRequest("1.2.3.4");

    // Limit 2, window 1000ms
    limiter.check(req, 2, 1000); // 1st request
    limiter.check(req, 2, 1000); // 2nd request

    // Should not throw
    limiter.shutdown();
  });

  it("should throw when limit is exceeded", () => {
    const limiter = new RateLimiter();
    const req = createMockRequest("1.2.3.4");

    limiter.check(req, 1, 1000); // 1st request (ok)

    expect(() => {
      limiter.check(req, 1, 1000); // 2nd request (fail)
    }).toThrow(HttpError);

    expect(() => {
      limiter.check(req, 1, 1000); // 2nd request (fail)
    }).toThrow("Too many requests");
    limiter.shutdown();
  });

  it("should track IPs independently", () => {
    const limiter = new RateLimiter();
    const req1 = createMockRequest("1.1.1.1");
    const req2 = createMockRequest("2.2.2.2");

    limiter.check(req1, 1, 1000);
    limiter.check(req2, 1, 1000); // different IP, should pass

    expect(() => limiter.check(req1, 1, 1000)).toThrow();
    expect(() => limiter.check(req2, 1, 1000)).toThrow();
    limiter.shutdown();
  });

  it("should reset count after window expires", async () => {
    const limiter = new RateLimiter();
    const req = createMockRequest("3.3.3.3");
    const limit = 1;
    const windowMs = 50;

    limiter.check(req, limit, windowMs);
    expect(() => limiter.check(req, limit, windowMs)).toThrow();

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

    // Should pass now
    limiter.check(req, limit, windowMs);
    limiter.shutdown();
  });
});
