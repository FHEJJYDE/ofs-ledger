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

async function verifyCoinBalances() {
    console.log('Verifying coin_balances table...');

    try {
        // Check if table exists by selecting 1 row
        const { data, error } = await supabase
            .from('coin_balances')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error querying coin_balances:', error);
            if (error.message.includes('does not exist')) {
                console.error('❌ Table coin_balances does NOT exist.');
            }
            return;
        }

        console.log('✅ Table coin_balances exists.');
        if (data && data.length > 0) {
            console.log('Sample row:', data[0]);
        } else {
            console.log('Table is empty.');
        }

        // Check for user_id column specifically
        const { error: colError } = await supabase
            .from('coin_balances')
            .select('user_id')
            .limit(1);

        if (colError) {
            console.error('❌ Column user_id might be missing:', colError.message);
        } else {
            console.log('✅ Column user_id exists.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

verifyCoinBalances();
