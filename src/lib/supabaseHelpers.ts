import { supabase } from './supabaseClient';

// ============================================
// AUTH HELPERS
// ============================================

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { data, error };
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// ============================================
// PROFILE HELPERS
// ============================================

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};

// ============================================
// WALLET HELPERS
// ============================================

export const getWallets = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_wallets')
        .select(`
      id,
      wallet_address,
      wallet_type,
      blockchain,
      is_verified,
      created_at,
      wallet_validations (
        id,
        validation_type,
        status,
        created_at
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
};

// ============================================
// TRANSACTION HELPERS
// ============================================

export const getTransactions = async (walletId: string) => {
    const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
      id,
      transaction_hash,
      transaction_type,
      amount,
      token_symbol,
      status,
      created_at,
      blockchain_data
    `)
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

    return { data, error };
};

// ============================================
// BLOCKCHAIN NETWORK HELPERS
// ============================================

export const getBlockchainNetworks = async () => {
    try {
        const { data, error } = await supabase
            .from('blockchain_networks')
            .select(`
        id,
        name,
        symbol,
        logo_url,
        is_testnet,
        is_active
      `)
            .order('name', { ascending: true });

        return { data, error };
    } catch (e) {
        console.error('Error fetching blockchain networks:', e);
        return { data: null, error: e };
    }
};

// ============================================
// TOKEN HELPERS
// ============================================

export const getTokens = async () => {
    try {
        const { data, error } = await supabase
            .from('tokens')
            .select(`
        id,
        name,
        symbol,
        logo_url,
        blockchain_network_id,
        contract_address,
        decimals,
        blockchain_networks (
          name
        )
      `)
            .order('symbol', { ascending: true });

        return { data, error };
    } catch (e) {
        console.error('Error fetching tokens:', e);
        return { data: null, error: e };
    }
};

// ============================================
// SMART CONTRACT HELPERS
// ============================================

export const getSmartContracts = async () => {
    try {
        const { data, error } = await supabase
            .from('smart_contracts')
            .select(`
        id,
        name,
        address,
        blockchain_network_id,
        contract_type,
        is_verified,
        blockchain_networks (
          name
        )
      `)
            .order('name', { ascending: true });

        return { data, error };
    } catch (e) {
        console.error('Error fetching smart contracts:', e);
        return { data: null, error: e };
    }
};

// ============================================
// NETWORK STATS HELPERS
// ============================================

export const getNetworkStats = async (networkId: string, limit: number = 24) => {
    try {
        const { data, error } = await supabase
            .from('network_stats')
            .select('*')
            .eq('blockchain_network_id', networkId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        return { data, error };
    } catch (e) {
        console.error('Error fetching network stats:', e);
        return { data: null, error: e };
    }
};
