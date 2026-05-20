import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('REDIS');

  constructor(@Inject(REDIS_CLIENT) public readonly client: Redis) {}

  async get(key: string): Promise<string | null> {
    const start = Date.now();
    try {
      const value = await this.client.get(key);
      this.logger.log(value !== null ? 'Cache hit' : 'Cache miss', {
        op: 'GET',
        key,
        hit: value !== null,
        durationMs: Date.now() - start,
      });
      return value;
    } catch (err) {
      this.logger.error('GET failed', {
        op: 'GET',
        key,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const start = Date.now();
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      this.logger.log('Cache set', {
        op: 'SET',
        key,
        ttlSeconds: ttlSeconds ?? null,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.logger.error('SET failed', {
        op: 'SET',
        key,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    const start = Date.now();
    try {
      const raw = await this.client.get(key);
      const hit = raw !== null;
      this.logger.log(hit ? 'Cache hit' : 'Cache miss', {
        op: 'GET_OBJ',
        key,
        hit,
        durationMs: Date.now() - start,
      });
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.error('GET_OBJ failed', {
        op: 'GET_OBJ',
        key,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // setObject delegates to set — logging fires there.
  async setObject<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    const start = Date.now();
    try {
      await this.client.del(key);
      this.logger.log('Cache deleted', {
        op: 'DEL',
        key,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.logger.error('DEL failed', {
        op: 'DEL',
        key,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    const start = Date.now();
    let keysDeleted = 0;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) {
          await this.client.del(...keys);
          keysDeleted += keys.length;
        }
      } while (cursor !== '0');

      this.logger.log('Cache pattern deleted', {
        op: 'DEL_PATTERN',
        pattern,
        keysDeleted,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.logger.error('DEL_PATTERN failed', {
        op: 'DEL_PATTERN',
        pattern,
        keysDeleted,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const start = Date.now();
    try {
      const count = await this.client.exists(key);
      const exists = count > 0;
      this.logger.log('Cache exists check', {
        op: 'EXISTS',
        key,
        exists,
        durationMs: Date.now() - start,
      });
      return exists;
    } catch (err) {
      this.logger.error('EXISTS failed', {
        op: 'EXISTS',
        key,
        durationMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
