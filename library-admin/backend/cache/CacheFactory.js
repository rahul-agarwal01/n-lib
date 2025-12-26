import { InMemoryCache } from './InMemoryCache.js';
import { RedisCache } from './RedisCache.js';

/**
 * Cache Factory - Creates cache instances based on configuration
 * 
 * Supported types:
 * - 'memory': In-memory cache (default)
 * - 'redis': Redis distributed cache
 */
export class CacheFactory {
  static cacheTypes = {
    'memory': InMemoryCache,
    'redis': RedisCache,
  };

  /**
   * Create a cache instance based on configuration
   * @param {object} config - Cache configuration
   * @param {string} config.type - Cache type ('memory' | 'redis')
   * @param {object} config.options - Cache-specific options
   * @returns {CacheInterface} - Cache instance
   */
  static create(config = {}) {
    const type = config.type || 'memory';
    const options = config.options || {};

    const CacheClass = this.cacheTypes[type];
    
    if (!CacheClass) {
      throw new Error(`Unknown cache type: ${type}. Supported types: ${Object.keys(this.cacheTypes).join(', ')}`);
    }

    console.log(`[CacheFactory] Creating ${type} cache with options:`, options);
    return new CacheClass(options);
  }

  /**
   * Register a custom cache type
   * @param {string} name - Cache type name
   * @param {class} CacheClass - Cache class that extends CacheInterface
   */
  static register(name, CacheClass) {
    this.cacheTypes[name] = CacheClass;
    console.log(`[CacheFactory] Registered custom cache type: ${name}`);
  }

  /**
   * Get list of available cache types
   * @returns {string[]}
   */
  static getAvailableTypes() {
    return Object.keys(this.cacheTypes);
  }
}

