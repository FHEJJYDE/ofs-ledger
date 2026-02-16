import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Coins, Users, RefreshCw, Edit, Plus, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface CoinBalance {
  id: string;
  user_id: string;
  coin_symbol: string;
  balance: number;
  last_updated: string;
}

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '/blockchains/bitcoin.png' },
  { symbol: 'XRP', name: 'XRP', icon: '/blockchains/xrp.png' },
  { symbol: 'ETH', name: 'Ethereum', icon: '/blockchains/ethereum.png' },
  { symbol: 'SOL', name: 'Solana', icon: '/blockchains/solana.png' },
  { symbol: 'USDT', name: 'Tether', icon: '/blockchains/usdt.png' }
];

const CoinBalancesAdmin = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingBalance, setEditingBalance] = useState<CoinBalance | null>(null);
  const [newBalanceValue, setNewBalanceValue] = useState<string>("");
  const [newCoinSymbol, setNewCoinSymbol] = useState<string>("BTC");
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [manualUserIdInput, setManualUserIdInput] = useState<string>("");
  const [manualUserEmailInput, setManualUserEmailInput] = useState<string>("");
  const [showManualUserInput, setShowManualUserInput] = useState<boolean>(false);

  // Get userId from URL query params if available
  const urlUserId = searchParams.get("userId");

  // Fetch users and balances
  useEffect(() => {
    fetchUsers();

    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
        setLoading(false);
        setError("Loading timed out. Please try again.");
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, []);

  // If userId is provided in URL, select that user automatically
  useEffect(() => {
    if (urlUserId && users.length > 0) {
      const userFromUrl = users.find(u => u.id === urlUserId);
      if (userFromUrl) {
        setSelectedUser(userFromUrl);
        // If we're coming from the Users page with a specific userId, automatically open the add dialog
        if (searchParams.get("action") === "add") {
          // We need to delay this slightly to ensure the component is fully rendered
          setTimeout(() => {
            setNewBalanceValue("0");
            setNewCoinSymbol(SUPPORTED_COINS[0].symbol);
            setEditDialogOpen(true);
            setIsAddingNew(true);
          }, 100);
        }
      }
    }
  }, [urlUserId, users]);

  useEffect(() => {
    if (selectedUser) {
      fetchBalances(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) {
        throw error;
      }

      setUsers(data || []);

      // Select the first user by default
      if (data && data.length > 0 && !selectedUser) {
        setSelectedUser(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users: " + error.message,
        variant: "destructive",
      });
      // Set empty users array to prevent undefined errors
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle manual user selection
  const handleManualUserSelect = () => {
    if (!manualUserIdInput || !manualUserEmailInput) {
      toast({
        title: "Error",
        description: "Please enter both User ID and Email",
        variant: "destructive",
      });
      return;
    }

    const manualUser: User = {
      id: manualUserIdInput,
      email: manualUserEmailInput,
      full_name: manualUserEmailInput.split('@')[0]
    };

    setSelectedUser(manualUser);
    setShowManualUserInput(false);
    fetchBalances(manualUser.id);

    toast({
      title: "Success",
      description: `Manually selected user ${manualUser.email}`,
    });
  };

  const fetchBalances = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // First try using the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_coin_balances', { p_user_id: userId });

      if (rpcError) {
        console.warn('RPC method failed, falling back to direct query:', rpcError);
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from('coin_balances')
          .select('*')
          .eq('user_id', userId);

        if (directError) {
          throw directError;
        }

        setBalances(directData || []);
      } else {
        setBalances(rpcData || []);
      }
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      setError(`Failed to fetch balances: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to fetch balances: ${error.message}`,
        variant: "destructive",
      });
      // Set empty balances array to prevent undefined errors
      setBalances([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedUser) {
      await fetchBalances(selectedUser.id);
    } else {
      await fetchUsers();
    }
    setRefreshing(false);
  };

  const handleEditBalance = (balance: CoinBalance) => {
    setEditingBalance(balance);
    setNewBalanceValue(balance.balance.toString());
    setEditDialogOpen(true);
    setIsAddingNew(false);
  };

  const handleAddNewBalance = () => {
    setEditingBalance(null);
    setNewBalanceValue("0");
    setNewCoinSymbol(SUPPORTED_COINS[0].symbol);
    setEditDialogOpen(true);
    setIsAddingNew(true);
  };

  const saveBalance = async () => {
    if (!selectedUser) return;

    try {
      const balanceValue = parseFloat(newBalanceValue);

      if (isNaN(balanceValue)) {
        throw new Error("Please enter a valid number");
      }

      if (balanceValue < 0) {
        throw new Error("Balance cannot be negative");
      }

      setLoading(true);

      if (isAddingNew) {
        // Check if this coin already exists for the user
        const existingCoin = balances.find(b => b.coin_symbol === newCoinSymbol);

        if (existingCoin) {
          throw new Error(`User already has a ${newCoinSymbol} balance. Please edit the existing one.`);
        }

        try {
          // Try using RPC function first
          const { error: rpcError } = await supabase.rpc('update_user_coin_balance', {
            p_user_id: selectedUser.id,
            p_coin_symbol: newCoinSymbol,
            p_balance: balanceValue
          });

          if (rpcError) {
            console.warn('RPC method failed, falling back to direct insert:', rpcError);
            // Fallback to direct insert if RPC fails
            const { error: insertError } = await supabase
              .from('coin_balances')
              .insert({
                user_id: selectedUser.id,
                coin_symbol: newCoinSymbol,
                balance: balanceValue,
                last_updated: new Date().toISOString(),
                updated_by: user?.id
              });

            if (insertError) throw insertError;
          }
        } catch (saveError: any) {
          throw new Error(`Failed to add balance: ${saveError.message}`);
        }

        toast({
          title: "Success",
          description: `Added ${newCoinSymbol} balance for ${selectedUser.email}`,
        });
      } else if (editingBalance) {
        try {
          // Try using RPC function first
          const { error: rpcError } = await supabase.rpc('update_user_coin_balance', {
            p_user_id: selectedUser.id,
            p_coin_symbol: editingBalance.coin_symbol,
            p_balance: balanceValue
          });

          if (rpcError) {
            console.warn('RPC method failed, falling back to direct update:', rpcError);
            // Fallback to direct update if RPC fails
            const { error: updateError } = await supabase
              .from('coin_balances')
              .update({
                balance: balanceValue,
                last_updated: new Date().toISOString(),
                updated_by: user?.id
              })
              .eq('id', editingBalance.id);

            if (updateError) throw updateError;
          }
        } catch (saveError: any) {
          throw new Error(`Failed to update balance: ${saveError.message}`);
        }

        toast({
          title: "Success",
          description: `Updated ${editingBalance.coin_symbol} balance for ${selectedUser.email}`,
        });
      }

      // Refresh balances
      await fetchBalances(selectedUser.id);
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving balance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const getCoinDetails = (symbol: string) => {
    return SUPPORTED_COINS.find(coin => coin.symbol === symbol) || {
      symbol,
      name: symbol,
      icon: '/placeholder-coin.svg'
    };
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    }).format(balance);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* User Selection */}
        <Card className="w-full md:w-1/3 h-fit">
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <CardDescription>Select a user to manage</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="space-y-4">
                {!showManualUserInput ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-muted-foreground mb-4">No users found or failed to load users.</p>
                    <Button onClick={() => setShowManualUserInput(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Enter User Manually
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-id">User ID</Label>
                      <Input
                        id="user-id"
                        placeholder="Enter user ID"
                        value={manualUserIdInput}
                        onChange={(e) => setManualUserIdInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">User Email</Label>
                      <Input
                        id="user-email"
                        placeholder="Enter user email"
                        value={manualUserEmailInput}
                        onChange={(e) => setManualUserEmailInput(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowManualUserInput(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleManualUserSelect}>
                        Select User
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="border rounded-md max-h-[400px] overflow-y-auto">
                  {users
                    .filter(user =>
                      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex-shrink-0">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {user.full_name || user.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <div className="flex-shrink-0 text-primary">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowManualUserInput(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Enter User Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balances Display */}
        <Card className="w-full md:flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Balances for {selectedUser?.full_name || selectedUser?.email?.split('@')[0] || 'selected user'}</CardTitle>
              <CardDescription>Manage cryptocurrency balances</CardDescription>
            </div>
            <Button onClick={() => {
              setNewBalanceValue("0");
              setNewCoinSymbol(SUPPORTED_COINS[0].symbol);
              setEditDialogOpen(true);
              setIsAddingNew(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Balance
            </Button>
          </CardHeader>
          <CardContent>
            {loading && !loadingTimeout ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error || loadingTimeout ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 max-w-md">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error || "Failed to load coin balances. This could be due to database connection issues."}</p>
                  <p className="text-sm mt-2">Try applying the database migration in the Supabase dashboard.</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLoading(true);
                      setLoadingTimeout(false);
                      setError(null);
                      if (selectedUser) {
                        fetchBalances(selectedUser.id);
                      } else {
                        fetchUsers();
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      // Force show empty state
                      setError(null);
                      setLoading(false);
                      setLoadingTimeout(false);
                      setBalances([]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Continue Anyway
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.length > 0 ? (
                    balances.map(balance => {
                      const coinDetails = getCoinDetails(balance.coin_symbol);
                      return (
                        <TableRow key={balance.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                                <img
                                  src={coinDetails?.icon}
                                  alt={balance.coin_symbol}
                                  className="w-5 h-5"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-coin.svg';
                                  }}
                                />
                              </div>
                              <span className="font-medium">{balance.coin_symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatBalance(balance.balance)}
                          </TableCell>
                          <TableCell>
                            {new Date(balance.last_updated).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBalance(balance)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No balances found. Add a new balance to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Add Balance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? "Add New Balance" : "Edit Balance"}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew
                ? "Add a new cryptocurrency balance for this user"
                : `Update the ${editingBalance?.coin_symbol} balance for ${selectedUser?.email}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isAddingNew && (
              <div className="space-y-2">
                <Label htmlFor="coin-symbol">Coin</Label>
                <Select value={newCoinSymbol} onValueChange={setNewCoinSymbol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Coin" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_COINS.map((coin) => (
                      <SelectItem key={coin.symbol} value={coin.symbol}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center">
                            <img
                              src={coin.icon}
                              alt={coin.symbol}
                              className="w-4 h-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-coin.svg';
                              }}
                            />
                          </div>
                          {coin.symbol} - {coin.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="balance-value">Balance</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="balance-value"
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={newBalanceValue}
                  onChange={(e) => setNewBalanceValue(e.target.value)}
                  className="font-mono"
                />
                <div className="font-medium">
                  {isAddingNew ? newCoinSymbol : editingBalance?.coin_symbol}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBalance} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isAddingNew ? "Add Balance" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoinBalancesAdmin;
