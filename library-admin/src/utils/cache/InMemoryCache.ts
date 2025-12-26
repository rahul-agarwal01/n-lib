import type { ICache, CacheStats, CacheEntry, CacheOptions } from './CacheInterface';

/**
 * In-Memory Cache Implementation for Frontend
 */
export class InMemoryCache implements ICache {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number | null;
  private maxSize: number;
  private _stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL ?? null; // No expiration by default (null = no TTL)
    this.maxSize = options.maxSize ?? 1000;
    this._stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  get<T>(key: string): T | null {
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
    return entry.value as T;
  }

  /**
   * Calculate seconds until midnight
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    // Enforce max size - remove oldest entries if needed
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // If ttlSeconds is explicitly provided, use it
    // Otherwise, if defaultTTL is null, calculate until midnight
    // Otherwise use defaultTTL
    let ttl: number | null;
    if (ttlSeconds !== undefined) {
      ttl = ttlSeconds;
    } else if (this.defaultTTL === null) {
      ttl = this.getSecondsUntilMidnight();
    } else {
      ttl = this.defaultTTL;
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + (ttl * 1000) : null
    };

    this.cache.set(key, entry);
    this._stats.sets++;
  }

  delete(key: string): boolean {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    if (existed) {
      this._stats.deletes++;
    }
    return existed;
  }

  deletePattern(pattern: string): number {
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

  clear(): void {
    this.cache.clear();
    this._stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  stats(): CacheStats {
    const total = this._stats.hits + this._stats.misses;
    const hitRate = total > 0
      ? (this._stats.hits / total * 100).toFixed(2)
      : '0.00';

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
   * Add an item to a cached array
   */
  addToArray<T extends { id: string }>(arrayKey: string, item: T): void {
    const cached = this.get<T[]>(arrayKey);
    if (!cached) return;
    
    const updated = [...cached, item];
    this.set(arrayKey, updated);
  }

  /**
   * Update a specific item in a cached array
   */
  updateInArray<T extends { id: string }>(arrayKey: string, item: T): void {
    const cached = this.get<T[]>(arrayKey);
    if (!cached) return;
    
    const updated = cached.map(i => i.id === item.id ? item : i);
    this.set(arrayKey, updated);
  }

  /**
   * Remove an item from a cached array by id
   */
  removeFromArray<T extends { id: string }>(arrayKey: string, id: string): void {
    const cached = this.get<T[]>(arrayKey);
    if (!cached) return;
    
    const updated = cached.filter(i => i.id !== id);
    this.set(arrayKey, updated);
  }
}

