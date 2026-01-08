import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { MessageQueue, currentUser, requireAuth } from '@arcane/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(currentUser);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
});

app.get('/users', requireAuth, (req, res) => {
    res.json({ users: [{ id: 1, name: 'John Doe', role: 'student' }] });
});

const start = async () => {
    try {
        await MessageQueue.getInstance().connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
        import('./events/userConsumer'); // Start the consumer

        app.listen(PORT, () => {
            console.log(`User Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start User Service', error);
    }
};

start();
