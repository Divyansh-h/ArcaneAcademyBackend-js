import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import { connectDB } from './config/db';
import { errorHandler, logger, MessageQueue } from '@arcane/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging (Simple manual middleware for now, or use morgan)
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

// Error handling - MUST be last
app.use(errorHandler);

// Connect DB and start server
const start = async () => {
    try {
        await connectDB();
        await MessageQueue.getInstance().connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
        app.listen(PORT, () => {
            logger.info(`Auth Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start Auth Service', error);
        process.exit(1);
    }
}

start();
