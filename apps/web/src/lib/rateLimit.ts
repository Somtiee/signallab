
import { NextResponse } from 'next/server';

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetTime: number;
  };
};

const store: RateLimitStore = {};

const WINDOW_SIZE_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 30; // 30 requests per minute

/**
 * Simple in-memory rate limiter.
 * Note: In a serverless environment (Vercel), this memory is not shared across instances.
 * For production, use Redis (e.g., Upstash).
 */
export function rateLimit(ip: string, route: string) {
  const key = `${ip}:${route}`;
  const now = Date.now();

  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + WINDOW_SIZE_MS,
    };
    return { success: true };
  }

  const record = store[key];

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_SIZE_MS;
    return { success: true };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { 
      success: false, 
      retryAfter 
    };
  }

  record.count++;
  return { success: true };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "rate_limited", retryAfter },
    { 
      status: 429, 
      headers: {
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
