import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface CoinBalance {
  coin_symbol: string;
  balance: number;
  last_updated: string;
  price?: number;
  change_24h?: number;
  value_usd?: number;
  icon?: string;
}

export interface CoinBalancesHook {
  balances: CoinBalance[];
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  totalValueUsd: number;
}

// Coin metadata including icons and default prices
const COIN_METADATA: Record<string, { name: string; icon: string; defaultPrice: number; defaultChange: number }> = {
  BTC: {
    name: 'Bitcoin',
    icon: '/blockchains/bitcoin.png',
    defaultPrice: 67500,
    defaultChange: 2.5
  },
  XRP: {
    name: 'XRP',
    icon: '/blockchains/xrp.png',
    defaultPrice: 0.62,
    defaultChange: -1.2
  },
  ETH: {
    name: 'Ethereum',
    icon: '/blockchains/ethereum.png',
    defaultPrice: 3200,
    defaultChange: 1.8
  },
  SOL: {
    name: 'Solana',
    icon: '/blockchains/solana.png',
    defaultPrice: 142,
    defaultChange: 4.3
  }
};

// Create a cache to persist balances between page reloads
const balanceCache: Record<string, { balances: CoinBalance[], timestamp: number }> = {};

export const useCoinBalances = (): CoinBalancesHook => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValueUsd, setTotalValueUsd] = useState<number>(0);

  // Use refs to track state for timeout callbacks to avoid stale closures
  const balancesRef = useRef<CoinBalance[]>([]);
  const loadingRef = useRef<boolean>(true);
  const userRef = useRef(user);

  // Update refs when state changes
  useEffect(() => {
    balancesRef.current = balances;
  }, [balances]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load from cache on initial render
  useEffect(() => {
    if (user?.id && balanceCache[user.id]) {
      const cachedData = balanceCache[user.id];
      // Only use cache if it's less than 5 minutes old
      if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
        console.log('Using cached balance data');
        setBalances(cachedData.balances);
        setTotalValueUsd(cachedData.balances.reduce((sum, coin) => sum + (coin.value_usd || 0), 0));
        setLoading(false);
      }
    }
  }, [user]);

  const fetchBalances = async () => {
    // If no user is available, keep loading state until user is available
    if (!user) {
      console.log('No user found, waiting for authentication');
      // Only set loading if we don't have balances
      if (balances.length === 0) setLoading(true);
      return;
    }

    // Don't reset balances when refreshing to prevent flickering
    // Only show loading if we don't have data yet
    if (balances.length === 0) setLoading(true);
    setError(null);

    try {
      // Fetch balances from Supabase
      const { data, error } = await supabase
        .from('coin_balances')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Enhance with price data and icons
      const enhancedBalances = data.map((balance: any) => {
        const metadata = COIN_METADATA[balance.coin_symbol] || {
          name: balance.coin_symbol,
          icon: '/placeholder-coin.svg',
          defaultPrice: 1,
          defaultChange: 0
        };

        // Add slight randomness to prices to simulate real-time changes
        const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // ±1% variation
        const price = metadata.defaultPrice * randomFactor;
        const change24h = metadata.defaultChange + (Math.random() * 0.5 - 0.25); // ±0.25% variation

        return {
          ...balance,
          balance: parseFloat(balance.balance),
          price,
          change_24h: change24h,
          value_usd: parseFloat(balance.balance) * price,
          icon: metadata.icon
        };
      });

      setBalances(enhancedBalances);

      // Calculate total value
      const total = enhancedBalances.reduce((sum, coin) => sum + (coin.value_usd || 0), 0);
      setTotalValueUsd(total);

      // Save to cache
      if (user?.id) {
        balanceCache[user.id] = {
          balances: enhancedBalances,
          timestamp: Date.now()
        };
        // Also save to localStorage for persistence between sessions
        try {
          localStorage.setItem(`coin_balances_${user.id}`, JSON.stringify({
            balances: enhancedBalances,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to save balances to localStorage:', e);
        }
      }
    } catch (err: any) {
      console.error('Error fetching coin balances:', err);
      setError(err.message || 'Failed to fetch coin balances');

      // Only retry if we don't already have data
      if (balancesRef.current.length === 0) {
        console.log('No existing balances, will retry in 3 seconds');
        setTimeout(() => {
          // Check if we still need to fetch (user might have navigated away or data might have loaded)
          if (loadingRef.current && balancesRef.current.length === 0 && userRef.current?.id === user.id) {
            fetchBalances();
          }
        }, 3000);
      } else {
        console.log('Using existing balance data despite fetch error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Only used for extreme fallback cases
  const useSampleData = () => {
    // Check ref for latest state
    if (balancesRef.current.length > 0) {
      console.log('Already have balance data, not using sample data');
      setLoading(false);
      return;
    }

    console.warn('FALLBACK: Using sample data as last resort');
    const sampleBalances = Object.entries(COIN_METADATA).map(([symbol, metadata]) => {
      // Using empty balances but with proper metadata
      const sampleBalance = 0;
      const price = metadata.defaultPrice;
      return {
        coin_symbol: symbol,
        balance: sampleBalance,
        last_updated: new Date().toISOString(),
        price,
        change_24h: metadata.defaultChange,
        value_usd: sampleBalance * price,
        icon: metadata.icon
      };
    });

    setBalances(sampleBalances);
    setTotalValueUsd(0);
    setLoading(false);
    setError('Unable to connect to database. Please try refreshing the page.');
  };

  useEffect(() => {
    if (!user) return;

    // Try to load from localStorage first
    let loadedFromLocal = false;
    try {
      const savedData = localStorage.getItem(`coin_balances_${user.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Only use localStorage data if it's less than 30 minutes old
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          console.log('Loading balances from localStorage');
          setBalances(parsed.balances);
          setTotalValueUsd(parsed.balances.reduce((sum: any, coin: any) => sum + (coin.value_usd || 0), 0));
          loadedFromLocal = true;
          // Set loading to false initially if we found local data
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('Failed to load balances from localStorage:', e);
    }

    // Always fetch fresh data, but logic inside fetchBalances handles loading state
    fetchBalances();

    // Set a timeout for fallback if data never loads
    const fallbackTimeout = setTimeout(() => {
      // Use refs to check current state
      if (loadingRef.current && balancesRef.current.length === 0) {
        // Only use sample data if we're still loading and have no data
        useSampleData();
      }
    }, 15000);

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [user]);

  return {
    balances,
    loading,
    error,
    refreshBalances: fetchBalances,
    totalValueUsd
  };
};
