import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import gradingRoutes from './routes/gradingRoutes';
import { MessageQueue } from '@arcane/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'grading-service' });
});

// Use Routes
app.use('/', gradingRoutes);

// Start Server
const start = async () => {
    try {
        await connectDB();
        await MessageQueue.getInstance().connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');

        // Initialize Worker
        import('./workers/gradeWorker'); // Start the worker

        app.listen(PORT, () => {
            console.log(`Grading Service running on port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
};

start();
