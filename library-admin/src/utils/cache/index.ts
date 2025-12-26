import { CacheFactory } from './CacheFactory';
import type { ICache } from './CacheInterface';
import { cacheConfig } from '../../config';

// Re-export types and classes
export type { ICache, CacheStats, CacheOptions } from './CacheInterface';
export { InMemoryCache } from './InMemoryCache';
export { CacheFactory } from './CacheFactory';

// Singleton cache instance
let cacheInstance: ICache | null = null;

export function getCache(): ICache {
  if (!cacheInstance) {
    cacheInstance = CacheFactory.create(cacheConfig);
  }
  return cacheInstance;
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // Books
  allBooks: () => 'books:all',
  book: (id: string) => `books:${id}`,
  
  // Users
  allUsers: () => 'users:all',
  user: (id: string) => `users:${id}`,
  
  // Categories
  allCategories: () => 'categories:all',
  category: (id: string) => `categories:${id}`,
  
  // Writers
  allWriters: () => 'writers:all',
  writer: (id: string) => `writers:${id}`,

  // Issues
  allIssues: () => 'issues:all',

  // Book Requests
  allBookRequests: () => 'book-requests:all',
  
  // Patterns for invalidation
  patterns: {
    allBooks: 'books:*',
    allUsers: 'users:*',
    allCategories: 'categories:*',
    allWriters: 'writers:*',
    allIssues: 'issues:*',
    allBookRequests: 'book-requests:*',
  }
};

