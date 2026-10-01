import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { sequelize } from '../config/db';

beforeAll(async () => {
    // Wait for DB connection
    try {
        await sequelize.authenticate();
        if (process.env.NODE_ENV === 'test') {
            await sequelize.sync({ force: true });
        }
        // Be careful with sync({ force: true }) in production/cloud DBs!
        // For this test with Neon, we probably shouldn't wipe it every time unless we have a separate test DB.
        // For now, we will just connect.
    } catch (err) {
        console.error('Test DB Connection Error:', err);
    }
});

afterAll(async () => {
    await sequelize.close();
});
