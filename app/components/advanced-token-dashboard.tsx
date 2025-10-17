"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Send, 
  Repeat, 
  TrendingUp, 
  Wallet,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";
import { parseUnits, formatUnits, isAddress } from "viem";

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  logo?: string;
  isNative?: boolean;
  network: 'sepolia' | 'mainnet';
}

// Liste des tokens populaires sur Arbitrum Sepolia et Mainnet
const POPULAR_TOKENS = [
    // Arbitrum Sepolia Testnet Tokens
    {
      address: "0x0000000000000000000000000000000000000000", // ETH
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      isNative: true,
      network: 'sepolia' as const,
      logo: "/tokens/eth.png"
    },
    {
      address: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E", // LINK Sepolia
      name: "Chainlink Token",
      symbol: "LINK",
      decimals: 18,
      network: 'sepolia' as const,
      logo: "/tokens/link.png"
    },
    {
      address: "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05", // USDC Sepolia
      name: "USD Coin",
      symbol: "USDC", 
      decimals: 6,
      network: 'sepolia' as const,
      logo: "/tokens/usdc.png"
    },
    {
      address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73", // USDT Sepolia
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      network: 'sepolia' as const,
      logo: "/tokens/usdt.png"
    },
    // Arbitrum Mainnet Tokens (pour référence future)
    {
      address: "0xA0b86991c431c8b804688eA79e4cbFF7b2d9Ae8f9",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      network: 'mainnet' as const,
      logo: "/tokens/usdc.png"
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      name: "Tether USD", 
      symbol: "USDT",
      decimals: 6,
      network: 'mainnet' as const,
      logo: "/tokens/usdt.png"
    },
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      network: 'mainnet' as const,
      logo: "/tokens/wbtc.png"
    }
];

export default function AdvancedTokenDashboard() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchTokenBalances = useCallback(async () => {
    if (!client?.account?.address) return;

    setIsLoading(true);
    const tokenList: Token[] = [];

    try {
      console.log("=== Fetching Token Balances ===");
      
      // 1. Fetch ETH balance
      try {
        const ethBalance = await client.request({
          method: "eth_getBalance",
          params: [client.account.address, "latest"]
        });
        
        const ethFormatted = formatUnits(BigInt(ethBalance), 18);
        
        tokenList.push({
          address: "0x0000000000000000000000000000000000000000",
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
          balance: ethBalance,
          balanceFormatted: ethFormatted,
          isNative: true,
          network: 'sepolia',
          logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
        });
      } catch (ethError) {
        console.error("Error fetching ETH balance:", ethError);
      }

      // 2. Fetch ALL token balances (not just popular ones)
      try {
        // First, get all tokens owned by the address (no filter)
        const allTokenBalances = await (client as any).request({
          method: "alchemy_getTokenBalances",
          params: [client.account.address]
        });

        console.log("All token balances:", allTokenBalances);

        if (allTokenBalances?.tokenBalances) {
          for (const tokenBalance of allTokenBalances.tokenBalances) {
            if (tokenBalance.tokenBalance && tokenBalance.tokenBalance !== "0x0") {
              // Check if it's a known token
              const knownToken = POPULAR_TOKENS.find(t => 
                t.address.toLowerCase() === tokenBalance.contractAddress.toLowerCase()
              );

              if (knownToken) {
                // Use known token info
                const balance = BigInt(tokenBalance.tokenBalance);
                const formatted = formatUnits(balance, knownToken.decimals);
                
                tokenList.push({
                  address: tokenBalance.contractAddress,
                  name: knownToken.name,
                  symbol: knownToken.symbol,
                  decimals: knownToken.decimals,
                  balance: tokenBalance.tokenBalance,
                  balanceFormatted: formatted,
                  network: 'sepolia',
                  logo: knownToken.logo
                });
              } else {
                // Unknown token - fetch metadata
                try {
                  const tokenMetadata = await (client as any).request({
                    method: "alchemy_getTokenMetadata",
                    params: [tokenBalance.contractAddress]
                  });

                  console.log("Token metadata for", tokenBalance.contractAddress, ":", tokenMetadata);

                  if (tokenMetadata?.symbol && tokenMetadata?.decimals !== null) {
                    const balance = BigInt(tokenBalance.tokenBalance);
                    const decimals = tokenMetadata.decimals || 18;
                    const formatted = formatUnits(balance, decimals);
                    
                    tokenList.push({
                      address: tokenBalance.contractAddress,
                      name: tokenMetadata.name || tokenMetadata.symbol || "Unknown Token",
                      symbol: tokenMetadata.symbol || "UNK",
                      decimals: decimals,
                      balance: tokenBalance.tokenBalance,
                      balanceFormatted: formatted,
                      network: 'sepolia'
                    });
                  }
                } catch (metadataError) {
                  console.error("Error fetching metadata for", tokenBalance.contractAddress, ":", metadataError);
                  
                  // Fallback for tokens without metadata
                  const balance = BigInt(tokenBalance.tokenBalance);
                  const formatted = formatUnits(balance, 18); // Assume 18 decimals
                  
                  tokenList.push({
                    address: tokenBalance.contractAddress,
                    name: "Unknown Token",
                    symbol: "UNK",
                    decimals: 18,
                    balance: tokenBalance.tokenBalance,
                    balanceFormatted: formatted,
                    network: 'sepolia'
                  });
                }
              }
            }
          }
        }
      } catch (tokenError) {
        console.error("Error fetching all token balances:", tokenError);
        
        // Fallback: try with known tokens only
        const tokenAddresses = POPULAR_TOKENS
          .filter(token => !token.isNative && token.network === 'sepolia')
          .map(token => token.address);

        if (tokenAddresses.length > 0) {
          try {
            const tokenBalances = await (client as any).request({
              method: "alchemy_getTokenBalances",
              params: [client.account.address, tokenAddresses]
            });

            if (tokenBalances?.tokenBalances) {
              for (const tokenBalance of tokenBalances.tokenBalances) {
                const tokenInfo = POPULAR_TOKENS.find(t => 
                  t.address.toLowerCase() === tokenBalance.contractAddress.toLowerCase()
                );
                
                if (tokenInfo && tokenBalance.tokenBalance && tokenBalance.tokenBalance !== "0x0") {
                  const balance = BigInt(tokenBalance.tokenBalance);
                  const formatted = formatUnits(balance, tokenInfo.decimals);
                  
                  tokenList.push({
                    address: tokenBalance.contractAddress,
                    name: tokenInfo.name,
                    symbol: tokenInfo.symbol,
                    decimals: tokenInfo.decimals,
                    balance: tokenBalance.tokenBalance,
                    balanceFormatted: formatted,
                    network: 'sepolia',
                    logo: tokenInfo.logo
                  });
                }
              }
            }
          } catch (fallbackError) {
            console.error("Fallback token fetch also failed:", fallbackError);
          }
        }
      }

      // 3. Add zero-balance popular tokens for display
      for (const popularToken of POPULAR_TOKENS.filter(t => t.network === 'sepolia')) {
        const exists = tokenList.find(t => 
          t.address.toLowerCase() === popularToken.address.toLowerCase()
        );
        
        if (!exists && !popularToken.isNative) {
          tokenList.push({
            address: popularToken.address,
            name: popularToken.name,
            symbol: popularToken.symbol,
            decimals: popularToken.decimals,
            balance: "0x0",
            balanceFormatted: "0",
            network: 'sepolia',
            logo: popularToken.logo
          });
        }
      }

      setTokens(tokenList);
      console.log("Found tokens:", tokenList);

      toast({
        title: "✅ Portfolio Updated",
        description: `Found ${tokenList.length} tokens in your wallet`,
        variant: "success",
      });

    } catch (error: any) {
      console.error("Error fetching balances:", error);
      toast({
        title: "❌ Failed to Fetch Balances",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [client, toast]);

  const transferToken = async () => {
    if (!selectedToken || !transferAmount || !recipientAddress || !client?.account?.address) {
      return;
    }

    if (!isAddress(recipientAddress)) {
      toast({
        title: "❌ Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    setIsTransferring(true);

    try {
      let userOp;

      if (selectedToken.isNative) {
        // ETH transfer
        const value = parseUnits(transferAmount, selectedToken.decimals);
        userOp = {
          target: recipientAddress as `0x${string}`,
          data: "0x" as `0x${string}`,
          value: value,
        };
      } else {
        // ERC-20 token transfer
        const value = parseUnits(transferAmount, selectedToken.decimals);
        const transferData = `0xa9059cbb${recipientAddress.slice(2).padStart(64, '0')}${value.toString(16).padStart(64, '0')}`;
        
        userOp = {
          target: selectedToken.address as `0x${string}`,
          data: transferData as `0x${string}`,
          value: BigInt(0),
        };
      }

      const hash = await client.sendUserOperation({
        uo: userOp,
        overrides: {
          paymasterAndData: "0x", // Pay gas directly
        },
      });

      toast({
        title: "✅ Transfer Sent!",
        description: `${transferAmount} ${selectedToken.symbol} sent to ${recipientAddress.slice(0, 10)}...`,
        variant: "success",
      });

      // Wait for confirmation
      const receipt = await client.waitForUserOperationTransaction(hash);
      
      toast({
        title: "🎉 Transfer Confirmed!",
        description: `Transaction confirmed on blockchain`,
        variant: "success",
      });

      // Refresh balances
      fetchTokenBalances();
      setTransferAmount("");
      setRecipientAddress("");

    } catch (error: any) {
      console.error("Transfer failed:", error);
      toast({
        title: "❌ Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (client?.account?.address) {
      fetchTokenBalances();
    }
  }, [client?.account?.address, fetchTokenBalances]);

  const totalPortfolioValue = tokens.reduce((acc, token) => {
    const balance = parseFloat(token.balanceFormatted);
    // Mock prices for demo - in real app, fetch from CoinGecko/CoinMarketCap
    const mockPrices: Record<string, number> = {
      'ETH': 2500,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 45000
    };
    const price = mockPrices[token.symbol] || 0;
    return acc + (balance * price);
  }, 0);

  return (
    <div className="space-y-6">
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Advanced Token Dashboard
              </CardTitle>
              <CardDescription>
                Complete portfolio management with real balances and transfers
              </CardDescription>
            </div>
            <Button
              onClick={fetchTokenBalances}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="hover-lift"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="space-y-6 mt-6">
              {/* Portfolio Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Total Value</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    ${totalPortfolioValue.toLocaleString()}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Assets</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {tokens.length}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Network</span>
                  </div>
                  <div className="text-lg font-bold mt-2">
                    Arbitrum Sepolia
                  </div>
                </Card>
              </div>

              {/* Token List */}
              <div className="space-y-3">
                <h4 className="font-medium">Your Tokens</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading balances...
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No tokens found. Get some testnet tokens from faucets!
                  </div>
                ) : (
                  tokens.map((token, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              {token.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {token.symbol} • {token.network}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {parseFloat(token.balanceFormatted).toFixed(6)} {token.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${(parseFloat(token.balanceFormatted) * 
                              (token.symbol === 'ETH' ? 2500 : token.symbol.includes('USD') ? 1 : 0)
                            ).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setActiveTab("transfer");
                          }}
                          disabled={parseFloat(token.balanceFormatted) === 0}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Token Selection */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Select Token to Send</h4>
                  <div className="space-y-2">
                    {tokens.filter(t => parseFloat(t.balanceFormatted) > 0).map((token, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedToken?.address === token.address ? "default" : "outline"
                        }
                        className="w-full justify-start"
                        onClick={() => setSelectedToken(token)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 
                                       flex items-center justify-center text-xs">
                            {token.symbol.slice(0, 2)}
                          </span>
                          <div className="text-left">
                            <div>{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">
                              Balance: {parseFloat(token.balanceFormatted).toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Transfer Form */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Transfer Details</h4>
                  {selectedToken ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.0"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          max={selectedToken.balanceFormatted}
                          step="0.000001"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Max: {parseFloat(selectedToken.balanceFormatted).toFixed(6)} {selectedToken.symbol}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={transferToken}
                        disabled={!transferAmount || !recipientAddress || isTransferring}
                        className="w-full button-gradient hover-lift"
                      >
                        {isTransferring ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send {selectedToken.symbol}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Select a token from the left to start a transfer
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="market" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Popular Tokens on Arbitrum</h4>
                  <div className="space-y-3">
                    {POPULAR_TOKENS.filter(t => t.network === 'sepolia').map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 
                                       flex items-center justify-center text-sm">
                            {token.symbol.slice(0, 2)}
                          </span>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://sepolia.arbiscan.io/token/${token.address}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-4">Get Testnet Tokens</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://faucets.chain.link/arbitrum-sepolia" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        ChainLink Faucet - ETH
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://faucet.quicknode.com/arbitrum/sepolia" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        QuickNode Faucet - ETH
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://faucet.triangleplatform.com/arbitrum/sepolia" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Triangle Faucet - Multi-tokens
                      </a>
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      💡 <strong>Tip:</strong> Once you have ETH, your Smart Wallet will deploy automatically on first transaction!
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}