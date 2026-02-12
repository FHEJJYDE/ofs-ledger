import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in: string | null;
  wallets_count: number;
  avatar_url: string;
}

export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchUsers as a callback so it can be used in both useEffect and returned
  const fetchUsers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // First check if the profiles table exists with a simple test query
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error checking profiles table:', countError);
        throw new Error(`The profiles table may not exist or is inaccessible: ${countError.message}`);
      }

      // Check if current user exists in profiles and is an admin
      let isAdmin = false;

      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = currentProfile?.role === 'admin';
      } catch (err) {
        console.warn('Could not determine admin status:', err);
      }

      // Attempt a direct SQL query as admin to bypass RLS issues
      // Note: This requires proper function setup in Supabase
      let profiles;

      if (isAdmin) {
        // First try the dedicated RPC function which should bypass RLS
        const { data: adminProfiles, error: rpcError } = await supabase
          .rpc('get_all_profiles');

        if (rpcError) {
          console.warn('get_all_profiles RPC function failed, this is expected until you run the SQL fix:', rpcError);
          console.log('Fallback to standard query - this may only return the current user due to RLS');
          // Fallback to standard query 
          const { data, error } = await supabase
            .from('profiles')
            .select('*');

          if (error) {
            console.error('Standard query failed:', error);
            throw error;
          }
          profiles = data;
        } else {
          console.log('Successfully used get_all_profiles RPC function');
          profiles = adminProfiles;
        }
      } else {
        // Non-admin users only see themselves
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);

        if (error) throw error;
        profiles = data;
      }

      if (!profiles || profiles.length === 0) {
        // Create a dummy profile for debugging in development
        if (process.env.NODE_ENV === 'development') {
          profiles = [{
            id: user.id,
            email: user.email,
            full_name: 'Development User',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            avatar_url: ''
          }];
        }
      }

      // No need to fetch admin users separately as role is stored directly in profiles table

      // Fetch wallet connections to count for each user
      const { data: walletConnections, error: walletsError } = await supabase
        .from('wallet_connections')
        .select('user_id');

      if (walletsError) {
        console.error('Error fetching wallet connections:', walletsError);
        // Continue with empty wallet connections
      }

      // Count wallets per user
      const walletCounts: Record<string, number> = {};
      (walletConnections || []).forEach(wallet => {
        walletCounts[wallet.user_id] = (walletCounts[wallet.user_id] || 0) + 1;
      });

      // Transform profiles into users with role and wallet count
      const transformedUsers: User[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        role: profile.role || 'user',
        status: profile.status || 'active',
        created_at: profile.created_at || '',
        last_sign_in: profile.last_sign_in || null,
        wallets_count: walletCounts[profile.id] || 0,
        avatar_url: profile.avatar_url || '',
      }));

      setUsers(transformedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users: ${err.message || 'Please try again'}`);

      // Let's try a SQL function to diagnose the issue
      try {
        console.log('Attempting diagnostic query without RLS...');

        // Check if the user is in the auth.users table directly
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
          console.log('Admin API not available:', authError.message);
        } else {
          console.log(`Found ${authUsers?.users?.length || 0} users in auth.users`);
        }
      } catch (diagErr) {
        console.error('Diagnostic query failed:', diagErr);
      }

      // Show a more user-friendly error
      setError('Unable to load users. This might be due to missing permissions or database setup. Please check the browser console for details.');

      // Create a fallback user entry if we're in development
      if (process.env.NODE_ENV === 'development') {
        setUsers([{
          id: user.id,
          email: user.email || 'test@example.com',
          full_name: 'Current User',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          last_sign_in: new Date().toISOString(),
          wallets_count: 0,
          avatar_url: ''
        }]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch users
  useEffect(() => {
    if (!user) return;

    fetchUsers();

    // Set up realtime subscription for profiles
    const profilesChannel: RealtimeChannel = supabase
      .channel('public:profiles')
      .on('postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refetch users when profiles change
          fetchUsers();
        }
      )
      .subscribe();

    // No need to listen to admin_users table as we're using the role directly from profiles

    // Set up realtime subscription for wallet_connections
    const walletsChannel: RealtimeChannel = supabase
      .channel('public:wallet_connections')
      .on('postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'wallet_connections'
        },
        () => {
          // Refetch users when wallet connections change
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      profilesChannel.unsubscribe();
      // adminChannel.unsubscribe();
      walletsChannel.unsubscribe();
    };
  }, [user, fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
