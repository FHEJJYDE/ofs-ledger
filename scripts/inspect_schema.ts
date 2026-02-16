import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName: string) {
    console.log(`\n--- Inspecting ${tableName} ---`);

    // Try to select one row to get column names (if any data exists)
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.log(`Error querying ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample row keys:', Object.keys(data[0]));
    } else {
        // If no data, try to insert a dummy row with "all possible" columns to see what fails, 
        // OR just checking policies might give a clue. 
        // Since we can't easily DESCRIBE TABLE via client, we will rely on key inference if data exists,
        // or we might have to use a known technique if empty.
        console.log('Table is empty. Cannot infer columns from data.');
    }
}

async function checkPolicies() {
    console.log('\n--- Checking Policies via RPC (if available) or inference --');
    // We can't easily check policies from the client SDK without an RPC. 
    // We will assume the 403 is RLS related.
}

async function main() {
    await inspectTable('wallet_connections');
    await inspectTable('security_events');
    await inspectTable('admin_users');
}

main();
