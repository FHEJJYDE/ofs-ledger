import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Coin metadata including icons and default prices
const COIN_OPTIONS = [
  { symbol: "BTC", name: "Bitcoin", icon: "/blockchains/bitcoin.png" },
  { symbol: "ETH", name: "Ethereum", icon: "/blockchains/ethereum.png" },
  { symbol: "SOL", name: "Solana", icon: "/blockchains/solana.png" },
  { symbol: "XRP", name: "XRP", icon: "/blockchains/xrp.png" },
  { symbol: "USDT", name: "Tether", icon: "/blockchains/usdt.png" }
];

interface AddCoinBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export function AddCoinBalanceDialog({ isOpen, onClose, userId, userEmail }: AddCoinBalanceDialogProps) {
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [keepOpen, setKeepOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoin) {
      setError("Please select a coin");
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log(`Adding ${amount} ${selectedCoin} to user ${userId}`);

      // First check if the user already has a balance for this coin
      const { data: existingBalance, error: fetchError } = await supabase
        .from('coin_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('coin_symbol', selectedCoin)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        throw fetchError;
      }

      let result;

      if (existingBalance) {
        // Update existing balance
        const newBalance = parseFloat(existingBalance.balance) + parseFloat(amount);
        result = await supabase
          .from('coin_balances')
          .update({
            balance: newBalance,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingBalance.id);
      } else {
        // Insert new balance
        result = await supabase
          .from('coin_balances')
          .insert({
            user_id: userId,
            coin_symbol: selectedCoin,
            balance: parseFloat(amount),
            last_updated: new Date().toISOString()
          });
      }

      if (result.error) {
        throw result.error;
      }

      // Show success message
      setSuccess(true);

      toast({
        title: "Balance added successfully",
        description: `Added ${amount} ${selectedCoin} to ${userEmail}`,
      });

      // Reset form but only close dialog if keepOpen is false
      setTimeout(() => {
        setSelectedCoin("");
        setAmount("");
        setSuccess(false);

        if (!keepOpen) {
          onClose();
        }
      }, 1500);

    } catch (err: any) {
      console.error("Error adding balance:", err);
      setError(err.message || "Failed to add balance. Please try again.");

      toast({
        title: "Error adding balance",
        description: err.message || "Failed to add balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Coin Balance</DialogTitle>
          <DialogDescription>
            Add cryptocurrency balance for user {userEmail}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="coin">Select Coin</Label>
            <Select
              value={selectedCoin}
              onValueChange={setSelectedCoin}
            >
              <SelectTrigger id="coin">
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {COIN_OPTIONS.map((coin) => (
                  <SelectItem key={coin.symbol} value={coin.symbol}>
                    <div className="flex items-center">
                      <img
                        src={coin.icon}
                        alt={coin.name}
                        className="w-5 h-5 mr-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-coin.svg";
                        }}
                      />
                      {coin.name} ({coin.symbol})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="keepOpen"
              checked={keepOpen}
              onCheckedChange={(checked) => setKeepOpen(checked as boolean)}
            />
            <Label htmlFor="keepOpen" className="text-sm font-normal">
              Keep dialog open for multiple additions
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Added Successfully
                </>
              ) : (
                "Add Balance"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
