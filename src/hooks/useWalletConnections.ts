import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ensureWalletConnectionsTable, createSampleData } from '@/lib/databaseHelpers';

export interface WalletConnection {
  id: string;
  user_id: string;
  wallet_address: string;
  chain_type: string;
  connected_at: string;
  created_at: string;
  validated?: boolean;
  validation_status?: string;
  validated_at?: string;
  user_email?: string;
  user_name?: string;
}

interface ProfileData {
  email?: string;
  full_name?: string;
}

export function useWalletConnections(isAdmin = false) {
  const { user } = useAuth();
  const [walletConnections, setWalletConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Define the stats type to include KYC properties
  type WalletStats = {
    total: number;
    validated: number;
    pending: number;
    kyc_approved: boolean;
    kyc_submitted: boolean;
  };

  const [stats, setStats] = useState<WalletStats>({
    total: 0,
    validated: 0,
    pending: 0,
    kyc_approved: false,
    kyc_submitted: false
  });

  // Fetch wallet connections
  useEffect(() => {
    if (!user) return;

    const fetchWalletConnections = async () => {
      setLoading(true);
      setError(null);

      try {
        // For admin, fetch all wallet connections with user details
        // For regular users, fetch only their own wallet connections
        // We now use 'wallet_details' table as it contains the actual submissions
        const query = isAdmin
          ? supabase
            .from('wallet_details')
            .select('*')
            .order('created_at', { ascending: false })
          : supabase
            .from('wallet_details')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to match the interface
        const transformedData = data.map((wallet: any) => ({
          id: wallet.id,
          user_id: wallet.user_id,
          wallet_address: wallet.wallet_address || 'Pending',
          chain_type: wallet.wallet_type || 'Unknown',
          connected_at: wallet.created_at,
          created_at: wallet.created_at,
          validated: wallet.status === 'approved',
          validation_status: wallet.status,
          validated_at: wallet.updated_at,
          user_email: wallet.user_email || '',
          user_name: wallet.user_name || '',
        }));

        setWalletConnections(transformedData);

        // Calculate stats
        const validatedCount = transformedData.filter(wallet =>
          wallet.validated === true || wallet.validation_status === 'approved'
        ).length;

        const pendingCount = transformedData.filter(wallet =>
          wallet.validation_status === 'pending'
        ).length;

        // Check if user has KYC documents
        let kycApproved = false;
        let kycSubmitted = false;

        if (!isAdmin && user) {
          try {
            const { data: kycData } = await supabase
              .from('kyc_documents')
              .select('status')
              .eq('user_id', user.id);

            if (kycData && kycData.length > 0) {
              kycSubmitted = true;
              kycApproved = kycData.some(doc => doc.status === 'approved');
            }
          } catch (kycError) {
            console.error('Error fetching KYC status:', kycError);
          }
        }

        setStats({
          total: transformedData.length,
          validated: validatedCount,
          pending: pendingCount,
          kyc_approved: kycApproved,
          kyc_submitted: kycSubmitted
        });
      } catch (err) {
        console.error('Error fetching wallet connections:', err);
        setError('Failed to load wallet connections');

        setWalletConnections([]);
        setStats({
          total: 0,
          validated: 0,
          pending: 0,
          kyc_approved: false,
          kyc_submitted: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletConnections();

    // Set up realtime subscription
    const channel: RealtimeChannel = supabase
      .channel('public:wallet_details')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_details',
          ...(isAdmin ? {} : { filter: `user_id=eq.${user.id}` })
        },
        async (payload) => {
          console.log('Wallet connection change received:', payload);
          // Refresh data on any change
          fetchWalletConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  // Add a function to manually refresh wallet connections
  const refreshWallets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // For admin, fetch all wallet connections with user details
      // We now use 'wallet_details' table 
      const query = isAdmin
        ? supabase
          .from('wallet_details')
          .select('*')
          .order('created_at', { ascending: false })
        : supabase
          .from('wallet_details')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match the interface
      const transformedData = data.map((wallet: any) => ({
        id: wallet.id,
        user_id: wallet.user_id,
        wallet_address: wallet.wallet_address || 'Pending',
        chain_type: wallet.wallet_type || 'Unknown',
        connected_at: wallet.created_at,
        created_at: wallet.created_at,
        validated: wallet.status === 'approved',
        validation_status: wallet.status,
        validated_at: wallet.updated_at,
        user_email: wallet.user_email || '',
        user_name: wallet.user_name || '',
      }));

      setWalletConnections(transformedData);

      // Calculate stats
      const validatedCount = transformedData.filter(wallet =>
        wallet.validated === true || wallet.validation_status === 'approved'
      ).length;

      const pendingCount = transformedData.filter(wallet =>
        wallet.validation_status === 'pending'
      ).length;

      setStats(prev => ({
        ...prev,
        total: transformedData.length,
        validated: validatedCount,
        pending: pendingCount
      }));
    } catch (err) {
      console.error('Error refreshing wallet connections:', err);
      setError('Failed to refresh wallet connections');
    } finally {
      setLoading(false);
    }
  };

  return { walletConnections, loading, error, stats, refreshWallets };
}
