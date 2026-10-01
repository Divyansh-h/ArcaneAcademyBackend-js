import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { pool } from '../config/db';

export const queryContext = new AsyncLocalStorage<{ queryCount: number }>();

// Monkey-patch the global pool.query once to intercept all queries
const originalQuery = pool.query.bind(pool);
(pool as any).query = async function (...args: any[]) {
  const store = queryContext.getStore();
  if (store) {
    store.queryCount++;
  }
  // Forward to original pg pool.query
  return originalQuery(...args);
};

/**
 * Middleware that tracks the exact number of database queries
 * executed during a single HTTP request's lifecycle.
 */
export const queryLogger = (req: Request, res: Response, next: NextFunction) => {
  const store = { queryCount: 0 };
  
  queryContext.run(store, () => {
    res.on('finish', () => {
      console.log(`[QueryLogger] ${req.method} ${req.originalUrl} executed ${store.queryCount} SQL queries.`);
      // We can also attach it to the headers so the frontend can display it in a debug panel
      res.setHeader('X-Query-Count', store.queryCount.toString());
    });
    next();
  });
};
