// this script is for testing database connection

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths to find .env.local in the root folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testConnection() {
  const url = process.env.DATABASE_URL;

  if (!url || url.includes('PASTE_YOUR_CONNECTION_STRING_HERE')) {
    console.error('❌ Error: DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');

  const sql = postgres(url);

  try {
    const result = await sql`SELECT 1 as connected`;
    if (result[0].connected === 1) {
      console.log('✅ Success! Database is reachable.');
    }
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection();
