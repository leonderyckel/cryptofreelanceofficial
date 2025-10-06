"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useSmartAccountClient } from "@account-kit/react";
import { formatEther } from "viem";

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  icon?: string;
}

export default function WalletBalance() {
  const { client } = useSmartAccountClient({});
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);

  const fetchBalance = async () => {
    if (!client?.account?.address) return;
    
    setIsLoading(true);
    try {
      // Mock ETH balance for demo
      const ethBalance = BigInt("1000000000000000000"); // 1 ETH mock
      
      setBalance(formatEther(ethBalance));
      
      // Mock token balances for Arbitrum Sepolia
      const mockTokens: TokenBalance[] = [
        { symbol: "ETH", balance: formatEther(ethBalance), decimals: 18 },
        { symbol: "USDC", balance: "0.00", decimals: 6, icon: "/icons/usdc.svg" },
        { symbol: "USDT", balance: "0.00", decimals: 6, icon: "/icons/usdt.svg" },
      ];
      
      setTokenBalances(mockTokens);
      
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance("0");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [client?.account?.address, fetchBalance]);

  const openInExplorer = () => {
    if (client?.account?.address && client?.chain?.blockExplorers?.default?.url) {
      window.open(
        `${client.chain.blockExplorers.default.url}/address/${client.account.address}`,
        "_blank"
      );
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
            <CardDescription>
              Your current balance on Arbitrum Sepolia testnet
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
              className="hover-lift"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchBalance}
              disabled={isLoading}
              className="hover-lift"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openInExplorer}
              className="hover-lift"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!client?.account?.address ? (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Deploy your Smart Wallet to view balance</p>
          </div>
        ) : (
          <>
            {/* Primary Balance */}
            <div className="text-center py-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-3xl font-bold gradient-text">
                  {showBalance ? `${parseFloat(balance).toFixed(6)} ETH` : "••••••"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ ${showBalance ? (parseFloat(balance) * 2000).toFixed(2) : "••••"} USD
                </p>
              </div>
            </div>

            {/* Token Balances */}
            <div className="space-y-3">
              <h4 className="font-medium">Token Balances</h4>
              {tokenBalances.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover-lift transition-all"
                >
                  <div className="flex items-center gap-3">
                    {token.icon ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full 
                           flex items-center justify-center text-white text-sm font-bold">
                        {token.symbol[0]}
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full 
                           flex items-center justify-center text-white text-sm font-bold">
                        {token.symbol[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.symbol === "ETH" ? "Ethereum" : `${token.symbol} Token`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {showBalance ? `${parseFloat(token.balance).toFixed(6)}` : "••••••"}
                    </p>
                    <p className="text-sm text-muted-foreground">{token.symbol}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Balance Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Network:</span>
                <Badge variant="outline" className="status-badge">
                  {client.chain?.name || "Arbitrum Sepolia"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="font-mono">
                  {client.account.address.slice(0, 6)}...{client.account.address.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gas Sponsorship:</span>
                <Badge variant="outline" className="status-badge success">
                  Enabled
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="hover-lift" onClick={openInExplorer}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
                <Button variant="outline" className="hover-lift" onClick={fetchBalance}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}