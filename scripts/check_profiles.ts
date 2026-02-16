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

async function checkProfiles() {
    console.log('Checking profiles table access...');

    // Try to select profiles
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);

    if (error) {
        console.error('Error querying profiles:', error.message);
        if (error.code === '42501') {
            console.error('❌ RLS Policy Violation (42501).');
        }
    } else {
        console.log(`✅ Query successful. Found ${count} profiles.`);
        console.log('Data sample:', data);
    }

    // Check if get_all_profiles RPC exists
    console.log('\nChecking get_all_profiles RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_profiles');

    if (rpcError) {
        console.error('❌ RPC get_all_profiles failed:', rpcError.message);
    } else {
        console.log('✅ RPC get_all_profiles worked. Count:', rpcData ? rpcData.length : 0);
    }
}

checkProfiles();
