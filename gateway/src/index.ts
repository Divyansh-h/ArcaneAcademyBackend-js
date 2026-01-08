import express from 'express';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { logger, errorHandler } from '@arcane/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Token Translation Middleware: Cookie -> Header
app.use((req, res, next) => {
    if (req.cookies.jwt) {
        req.headers.authorization = `Bearer ${req.cookies.jwt}`;
    }
    next();
});

import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

// ... (other imports)

// Setup Redis Client
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
});

redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
});

// Configure Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
        // @ts-expect-error - Known type mismatch between ioredis and rate-limit-redis
        sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply Rate Limit globally
app.use(limiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`Gateway Request: ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

// Service Routes via Proxy
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const gradingServiceUrl = process.env.GRADING_SERVICE_URL || 'http://localhost:3004';

app.use('/api/auth', proxy(authServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/auth' + req.url;
    }
}));

app.use('/api/users', proxy(userServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/users' + req.url;
    }
}));

app.use('/api/grading', proxy(gradingServiceUrl, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => {
        return req.url;
    }
}));

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Gateway running on port ${PORT}`);
});
