/**
 * Redis Connection Manager
 * Caching, sessions, and queue management
 */

const Redis = require('ioredis');
const config = require('../config');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.client) {
      return this.client;
    }

    const redisConfig = config.redis;

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('❌ Redis max retry attempts reached');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log(`✅ Redis connected: ${redisConfig.host}:${redisConfig.port}`);
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    return this.client;
  }

  /**
   * Get value by key
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (!this.client) await this.connect();
    
    const value = await this.client.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Set value with optional TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = null) {
    if (!this.client) await this.connect();
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl) {
      await this.client.setex(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  /**
   * Delete key
   * @param {string} key
   */
  async del(key) {
    if (!this.client) await this.connect();
    await this.client.del(key);
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    if (!this.client) await this.connect();
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Increment value
   * @param {string} key
   * @returns {Promise<number>}
   */
  async incr(key) {
    if (!this.client) await this.connect();
    return await this.client.incr(key);
  }

  /**
   * Decrement value
   * @param {string} key
   * @returns {Promise<number>}
   */
  async decr(key) {
    if (!this.client) await this.connect();
    return await this.client.decr(key);
  }

  /**
   * Set with expiration in seconds
   * @param {string} key
   * @param {number} seconds
   */
  async expire(key, seconds) {
    if (!this.client) await this.connect();
    await this.client.expire(key, seconds);
  }

  /**
   * Get multiple keys
   * @param {Array<string>} keys
   * @returns {Promise<Object>}
   */
  async mget(keys) {
    if (!this.client) await this.connect();
    const values = await this.client.mget(...keys);
    const result = {};
    keys.forEach((key, index) => {
      try {
        result[key] = JSON.parse(values[index]);
      } catch {
        result[key] = values[index];
      }
    });
    return result;
  }

  /**
   * Publish to channel
   * @param {string} channel
   * @param {any} message
   */
  async publish(channel, message) {
    if (!this.client) await this.connect();
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    await this.client.publish(channel, msg);
  }

  /**
   * Subscribe to channel
   * @param {string} channel
   * @param {Function} callback
   */
  async subscribe(channel, callback) {
    if (!this.client) await this.connect();
    
    const subClient = this.client.duplicate();
    await subClient.subscribe(channel);
    
    subClient.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(message));
        } catch {
          callback(message);
        }
      }
    });
    
    return subClient;
  }

  /**
   * Clear all keys (use with caution!)
   */
  async flushAll() {
    if (!this.client) await this.connect();
    await this.client.flushall();
    console.warn('⚠️  Redis flushed all keys');
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      if (!this.client) await this.connect();
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Singleton instance
const redis = new RedisClient();

module.exports = redis;
