import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Environment-based config
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum connections in pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // Close idle clients after 30s
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '2000', 10), // Return an error after 2s if connection could not be established
};

if (!dbConfig.connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Initialize the Connection Pool
export const pool = new Pool(dbConfig);

// Listen for pool errors (e.g., network partitions, database restarts)
// This prevents idle clients from crashing the Node.js process silently
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // Optional: trigger alerts/metrics here
});

/**
 * Graceful shutdown helper for the pool.
 * Should be called when the Express server receives a SIGTERM/SIGINT.
 */
export const closePool = async () => {
  try {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('Database connection pool closed successfully.');
  } catch (err) {
    console.error('Error during pool shutdown', err);
  }
};
