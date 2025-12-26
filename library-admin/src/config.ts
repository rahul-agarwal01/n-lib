// API Configuration
export const apiConfig = {
  baseUrl: 'http://localhost:3001/api',
};

// Cache Configuration
export const cacheConfig = {
  type: 'memory' as const,
  options: {
    defaultTTL: null, // null = expires at midnight automatically, or use refresh button to clear manually
    maxSize: 100,
  }
};

