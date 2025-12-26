// Database configuration
export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'n_lib',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Admin credentials (hardcoded for now)
export const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

// Server configuration
export const serverConfig = {
  port: 3001
};

// Cache configuration
// To switch to Redis, change type to 'redis' and provide connection options
export const cacheConfig = {
  type: 'memory', // 'memory' | 'redis'
  options: {
    // In-memory cache options
    defaultTTL: null,    // null = expires at midnight automatically, or use refresh button to clear manually
    maxSize: 1000,      // Max cache entries
    
    // Redis options (used when type is 'redis')
    // host: 'localhost',
    // port: 6379,
    // password: '',
    // db: 0,
    // keyPrefix: 'library:',
  }
};

