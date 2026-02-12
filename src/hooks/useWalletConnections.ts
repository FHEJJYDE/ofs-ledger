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
        const query = isAdmin
          ? supabase
            .from('wallet_connections')
            .select('*, profiles(email, full_name)')
            .order('connected_at', { ascending: false })
          : supabase
            .from('wallet_connections')
            .select('*')
            .eq('user_id', user.id)
            .order('connected_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to include user_email and user_name
        const transformedData = data.map((wallet: any) => ({
          id: wallet.id,
          user_id: wallet.user_id,
          wallet_address: wallet.wallet_address,
          chain_type: wallet.chain_type || '',
          connected_at: wallet.connected_at,
          created_at: wallet.created_at,
          validated: wallet.validated,
          validation_status: wallet.validation_status,
          validated_at: wallet.validated_at,
          user_email: wallet.profiles?.email || '',
          user_name: wallet.profiles?.full_name || '',
        }));

        setWalletConnections(transformedData);

        // Calculate stats
        const validatedCount = transformedData.filter(wallet =>
          wallet.validated === true || wallet.validation_status === 'validated'
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
          pending: transformedData.length - validatedCount,
          kyc_approved: kycApproved,
          kyc_submitted: kycSubmitted
        });
      } catch (err) {
        console.error('Error fetching wallet connections:', err);
        setError('Failed to load wallet connections');

        // Use empty arrays and default stats as fallback
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
      .channel('public:wallet_connections')
      .on('postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'wallet_connections',
          ...(isAdmin ? {} : { filter: `user_id=eq.${user.id}` }) // Filter for user's own connections if not admin
        },
        async (payload) => {
          console.log('Wallet connection change received:', payload);

          try {
            // Handle different event types
            if (payload.eventType === 'INSERT') {
              // Fetch the complete wallet connection with user details
              const { data, error } = await supabase
                .from('wallet_connections')
                .select(isAdmin ? '*, profiles(email, full_name)' : '*')
                .eq('id', payload.new.id)
                .single();

              if (error) throw error;

              if (data) {
                const walletData = data as any;
                const newWallet: WalletConnection = {
                  id: walletData.id,
                  user_id: walletData.user_id,
                  wallet_address: walletData.wallet_address,
                  chain_type: walletData.chain_type || '',
                  connected_at: walletData.connected_at,
                  created_at: walletData.created_at,
                  validated: walletData.validated,
                  validation_status: walletData.validation_status,
                  validated_at: walletData.validated_at,
                  user_email: walletData.profiles?.email || '',
                  user_name: walletData.profiles?.full_name || '',
                };

                setWalletConnections(prev => [newWallet, ...prev]);
                setStats(prev => ({
                  ...prev,
                  total: prev.total + 1,
                  pending: prev.pending + 1
                }));
              }
            } else if (payload.eventType === 'UPDATE') {
              // Update existing wallet connection
              setWalletConnections(prev =>
                prev.map(wallet =>
                  wallet.id === payload.new.id
                    ? {
                      ...wallet,
                      wallet_address: payload.new.wallet_address || wallet.wallet_address,
                      chain_type: payload.new.chain_type || wallet.chain_type,
                      validated: payload.new.validated,
                      validation_status: payload.new.validation_status,
                      validated_at: payload.new.validated_at,
                    }
                    : wallet
                )
              );

              // Update stats if validation status changed
              if (payload.old.validated !== payload.new.validated ||
                payload.old.validation_status !== payload.new.validation_status) {
                const isNewlyValidated =
                  payload.new.validated === true ||
                  payload.new.validation_status === 'validated';

                const wasValidated =
                  payload.old.validated === true ||
                  payload.old.validation_status === 'validated';

                if (isNewlyValidated && !wasValidated) {
                  setStats(prev => ({
                    ...prev,
                    validated: prev.validated + 1,
                    pending: prev.pending - 1
                  }));
                } else if (!isNewlyValidated && wasValidated) {
                  setStats(prev => ({
                    ...prev,
                    validated: prev.validated - 1,
                    pending: prev.pending + 1
                  }));
                }
              }
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted wallet connection
              setWalletConnections(prev =>
                prev.filter(wallet => wallet.id !== payload.old.id)
              );

              // Update stats
              const wasValidated =
                payload.old.validated === true ||
                payload.old.validation_status === 'validated';

              setStats(prev => ({
                total: prev.total - 1,
                validated: wasValidated ? prev.validated - 1 : prev.validated,
                pending: wasValidated ? prev.pending : prev.pending - 1,
                kyc_approved: prev.kyc_approved,
                kyc_submitted: prev.kyc_submitted
              }));
            }
          } catch (err) {
            console.error('Error processing realtime wallet connection update:', err);
          }
        }
      )
      .subscribe();

    console.log('Subscribed to wallet connections channel');

    return () => {
      console.log('Unsubscribing from wallet connections channel');
      channel.unsubscribe();
    };
  }, [user, isAdmin]);

  // Add a function to manually refresh wallet connections
  const refreshWallets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure the wallet_connections table exists
      const tableExists = await ensureWalletConnectionsTable();

      if (!tableExists) {
        throw new Error('Could not create or access wallet_connections table');
      }

      // For admin, fetch all wallet connections with user details
      // For regular users, fetch only their own wallet connections
      const query = isAdmin
        ? supabase
          .from('wallet_connections')
          .select('*, profiles(email, full_name)')
          .order('connected_at', { ascending: false })
        : supabase
          .from('wallet_connections')
          .select('*')
          .eq('user_id', user.id)
          .order('connected_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include user_email and user_name
      const transformedData = data.map((wallet: any) => ({
        id: wallet.id,
        user_id: wallet.user_id,
        wallet_address: wallet.wallet_address,
        chain_type: wallet.chain_type || '',
        connected_at: wallet.connected_at,
        created_at: wallet.created_at,
        validated: wallet.validated,
        validation_status: wallet.validation_status,
        validated_at: wallet.validated_at,
        user_email: wallet.profiles?.email || '',
        user_name: wallet.profiles?.full_name || '',
      }));

      setWalletConnections(transformedData);

      // Calculate stats
      const validatedCount = transformedData.filter(wallet =>
        wallet.validated === true || wallet.validation_status === 'validated'
      ).length;

      setStats({
        total: transformedData.length,
        validated: validatedCount,
        pending: transformedData.length - validatedCount,
        kyc_approved: stats.kyc_approved,
        kyc_submitted: stats.kyc_submitted
      });
    } catch (err) {
      console.error('Error refreshing wallet connections:', err);
      setError('Failed to refresh wallet connections');
    } finally {
      setLoading(false);
    }
  };

  return { walletConnections, loading, error, stats, refreshWallets };
}
