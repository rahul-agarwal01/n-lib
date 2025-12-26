import { CacheInterface } from './CacheInterface.js';

/**
 * In-Memory Cache Implementation
 * Uses a Map for storage with TTL support
 */
export class InMemoryCache extends CacheInterface {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL ?? null; // No expiration by default (null = no TTL)
    this.maxSize = options.maxSize || 1000; // Max entries
    this._stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Start cleanup interval for expired entries
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 60000); // Cleanup every minute
  }

  async get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this._stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this._stats.misses++;
      return null;
    }

    this._stats.hits++;
    return entry.value;
  }

  /**
   * Calculate seconds until midnight
   */
  _getSecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  async set(key, value, ttlSeconds = null) {
    // Enforce max size - remove oldest entries if needed
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // If ttlSeconds is explicitly provided, use it
    // Otherwise, if defaultTTL is null, calculate until midnight
    // Otherwise use defaultTTL
    let ttl;
    if (ttlSeconds !== null) {
      ttl = ttlSeconds;
    } else if (this.defaultTTL === null) {
      ttl = this._getSecondsUntilMidnight();
    } else {
      ttl = this.defaultTTL;
    }

    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + (ttl * 1000) : null
    };

    this.cache.set(key, entry);
    this._stats.sets++;
  }

  async delete(key) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    if (existed) {
      this._stats.deletes++;
    }
    return existed;
  }

  async deletePattern(pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this._stats.deletes += deletedCount;
    return deletedCount;
  }

  async clear() {
    this.cache.clear();
    this._stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  async has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async stats() {
    const hitRate = this._stats.hits + this._stats.misses > 0
      ? (this._stats.hits / (this._stats.hits + this._stats.misses) * 100).toFixed(2)
      : 0;

    return {
      type: 'in-memory',
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this._stats.hits,
      misses: this._stats.misses,
      sets: this._stats.sets,
      deletes: this._stats.deletes,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Cleanup expired entries
   * @private
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

