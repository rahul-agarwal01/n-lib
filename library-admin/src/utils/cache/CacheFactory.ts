import { InMemoryCache } from './InMemoryCache';
import type { ICache, CacheOptions } from './CacheInterface';

export type CacheType = 'memory';

export interface CacheConfig {
  type: CacheType;
  options?: CacheOptions;
}

/**
 * Cache Factory - Creates cache instances based on configuration
 */
export class CacheFactory {
  private static cacheTypes: Record<CacheType, new (options?: CacheOptions) => ICache> = {
    'memory': InMemoryCache,
  };

  static create(config: CacheConfig = { type: 'memory' }): ICache {
    const { type, options } = config;
    const CacheClass = this.cacheTypes[type];
    
    if (!CacheClass) {
      throw new Error(`Unknown cache type: ${type}`);
    }

    console.log(`[CacheFactory] Creating ${type} cache`);
    return new CacheClass(options);
  }

  static getAvailableTypes(): CacheType[] {
    return Object.keys(this.cacheTypes) as CacheType[];
  }
}

