require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL, but we might need to relax checks or provide CA
    });

    try {
        await client.connect();
        console.log('Connected successfully!');

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log('Tables found:', res.rows.map(r => r.table_name));

        // Check for specific tables
        const tables = res.rows.map(r => r.table_name);
        if (tables.includes('jobs')) {
            console.log('Table "jobs" already exists.');
        } else {
            console.log('Table "jobs" does NOT exist.');
        }

    } catch (err) {
        console.error('Connection error', err);
    } finally {
        await client.end();
    }
}

testConnection();
