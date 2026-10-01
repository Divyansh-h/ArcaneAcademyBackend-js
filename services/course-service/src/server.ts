import express from 'express';
import { closePool } from './config/db';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes would go here (e.g. app.use('/courses', courseRoutes))
app.get('/health', (req, res) => res.status(200).send('OK'));

const server = app.listen(PORT, () => {
  console.log(`Course Service listening on port ${PORT}`);
});

/**
 * Graceful Shutdown Handler
 * Ensures that the Express server stops accepting new requests,
 * finishes ongoing requests, and safely closes the database pool
 * before the Node process exits.
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Stop accepting new HTTP requests
  server.close(async (err) => {
    if (err) {
      console.error('Error during HTTP server closure:', err);
      process.exit(1);
    }
    console.log('HTTP server closed.');
    
    // 2. Drain and close the PostgreSQL connection pool
    await closePool();
    
    console.log('Graceful shutdown completed. Exiting process.');
    process.exit(0);
  });

  // Failsafe: if graceful shutdown takes too long (e.g. > 10s), force exit
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals (Docker/Kubernetes sends SIGTERM)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
