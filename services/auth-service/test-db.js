const { Client } = require('pg');

const connectionString = 'postgresql://login%20signup%20and%20number%20upload_owner:npg_BPTbp2yO0ofN@ep-divine-mountain-a13vemz3-pooler.ap-southeast-1.aws.neon.tech/login%20signup%20and%20number%20upload?sslmode=require';

console.log('Testing connection to:', connectionString);

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('Connected successfully');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('Query result:', res.rows[0]);
        return client.end();
    })
    .catch(err => {
        console.error('Connection error details:', err);
        client.end();
    });
