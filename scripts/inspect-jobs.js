require('dotenv').config();
const { Client } = require('pg');

async function inspectTable() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected successfully!');

        const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
    `);

        console.log('Columns in "jobs" table:');
        console.table(res.rows);

    } catch (err) {
        console.error('Connection error', err);
    } finally {
        await client.end();
    }
}

inspectTable();
