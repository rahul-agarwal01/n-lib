/**
 * Cache Interface - Contract for all cache implementations
 */
export interface ICache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  delete(key: string): boolean;
  deletePattern(pattern: string): number;
  clear(): void;
  has(key: string): boolean;
  stats(): CacheStats;
  
  // Array manipulation helpers
  addToArray<T extends { id: string }>(arrayKey: string, item: T): void;
  updateInArray<T extends { id: string }>(arrayKey: string, item: T): void;
  removeFromArray<T extends { id: string }>(arrayKey: string, id: string): void;
}

export interface CacheStats {
  type: string;
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: string;
}

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number | null;
}

export interface CacheOptions {
  defaultTTL?: number | null;
  maxSize?: number;
}

