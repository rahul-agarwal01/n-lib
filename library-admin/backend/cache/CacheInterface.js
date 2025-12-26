/**
 * Cache Interface - Contract for all cache implementations
 * All cache implementations must implement these methods
 */
export class CacheInterface {
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null if not found
   */
  async get(key) {
    throw new Error('Method get() must be implemented');
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds = null) {
    throw new Error('Method set() must be implemented');
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async delete(key) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'books:*')
   * @returns {Promise<number>} - Number of keys deleted
   */
  async deletePattern(pattern) {
    throw new Error('Method deletePattern() must be implemented');
  }

  /**
   * Clear all cache
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('Method clear() must be implemented');
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    throw new Error('Method has() must be implemented');
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} - Stats like hits, misses, size
   */
  async stats() {
    throw new Error('Method stats() must be implemented');
  }
}

