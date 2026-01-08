import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL;

export let sequelize: Sequelize;

if (databaseUrl) {
    const url = new URL(databaseUrl);
    // Decode components to handle spaces/special characters
    const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const dbUser = decodeURIComponent(url.username);
    const dbPassword = decodeURIComponent(url.password);
    const dbHost = url.hostname;
    const dbPort = Number(url.port) || 5432;

    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'grading_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false,
        }
    );
}

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');
        // Sync models
        await sequelize.sync();
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
};
