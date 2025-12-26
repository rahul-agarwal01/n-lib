import { CacheFactory } from './CacheFactory.js';
import { cacheConfig } from '../config.js';

// Export interfaces and classes for custom implementations
export { CacheInterface } from './CacheInterface.js';
export { InMemoryCache } from './InMemoryCache.js';
export { RedisCache } from './RedisCache.js';
export { CacheFactory } from './CacheFactory.js';

// Create singleton cache instance based on config
let cacheInstance = null;

/**
 * Get the cache singleton instance
 * @returns {CacheInterface}
 */
export function getCache() {
  if (!cacheInstance) {
    cacheInstance = CacheFactory.create(cacheConfig);
  }
  return cacheInstance;
}

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  // Books
  allBooks: () => 'books:all',
  book: (id) => `books:${id}`,
  bookSearch: (query) => `books:search:${query}`,
  
  // Users
  allUsers: () => 'users:all',
  user: (id) => `users:${id}`,
  userSearch: (query) => `users:search:${query}`,
  
  // Categories
  allCategories: () => 'categories:all',
  category: (id) => `categories:${id}`,
  
  // Writers
  allWriters: () => 'writers:all',
  writer: (id) => `writers:${id}`,
  
  // Patterns for invalidation
  patterns: {
    allBooks: 'books:*',
    allUsers: 'users:*',
    allCategories: 'categories:*',
    allWriters: 'writers:*',
  }
};

