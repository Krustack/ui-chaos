import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL ?? 'https://example.upstash.io';
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? 'demo-token';

export const redis = new Redis({ url, token });

export function getRedisClient() {
  return redis;
}
