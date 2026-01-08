import request from 'supertest';
import express from 'express';
import authRoutes from '../authRoutes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Helper to generate random email
const randomEmail = () => `test${Math.floor(Math.random() * 10000)}@example.com`;

describe('Auth Service', () => {
    it('registers a user successfully', async () => {
        const email = randomEmail();
        const res = await request(app)
            .post('/auth/register')
            .send({
                email,
                password: 'password123',
                name: 'Test User'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', email);
    });

    it('fails duplicate registration', async () => {
        const email = randomEmail();
        // First registration
        await request(app)
            .post('/auth/register')
            .send({
                email,
                password: 'password123',
                name: 'Test User'
            });

        // Duplicate registration
        const res = await request(app)
            .post('/auth/register')
            .send({
                email,
                password: 'password123',
                name: 'Test User'
            });

        expect(res.status).toBe(400); // Assuming 400 for bad request
    });

    it('logs in a user successfully', async () => {
        const email = randomEmail();
        const password = 'password123';

        // Register first
        await request(app)
            .post('/auth/register')
            .send({ email, password, name: 'Login User' });

        // Try login
        const res = await request(app)
            .post('/auth/login')
            .send({ email, password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});
