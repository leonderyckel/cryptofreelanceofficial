"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, ArrowRight, Wallet, Copy } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";

export default function PolygonDeposit() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0.001");

  const walletAddress = client?.account?.address || "";

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "✅ Address Copied!",
        description: "Smart Wallet address copied to clipboard",
        variant: "success",
      });
    }
  };

  const connectToPolygon = async () => {
    setIsConnecting(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Switch to Polygon network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }], // Polygon Mainnet
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x89',
                    chainName: 'Polygon Mainnet',
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC',
                      decimals: 18,
                    },
                    rpcUrls: ['https://polygon-rpc.com/'],
                    blockExplorerUrls: ['https://polygonscan.com/'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Failed to add Polygon network:', addError);
              throw addError;
            }
          } else {
            throw switchError;
          }
        }

        toast({
          title: "✅ Connected to Polygon!",
          description: "You can now send MATIC from MetaMask",
          variant: "success",
        });
      } else {
        throw new Error("MetaMask not detected");
      }
    } catch (error: any) {
      console.error("Failed to connect to Polygon:", error);
      toast({
        title: "❌ Connection Failed",
        description: error.message || "Failed to connect to Polygon network",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendPolygonTransfer = async () => {
    if (!walletAddress || !depositAmount) return;

    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request transaction from MetaMask
        const transactionParameters = {
          to: walletAddress,
          value: (parseFloat(depositAmount) * 1e18).toString(16), // Convert to wei and hex
          from: window.ethereum.selectedAddress,
        };

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        toast({
          title: "✅ Transfer Initiated!",
          description: `Sending ${depositAmount} MATIC to your Smart Wallet`,
          variant: "success",
        });

        // You can add transaction tracking here
        console.log("Transaction hash:", txHash);
      }
    } catch (error: any) {
      console.error("Transfer failed:", error);
      toast({
        title: "❌ Transfer Failed",
        description: error.message || "Failed to send MATIC",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="gradient-text flex items-center gap-2">
          🟣 Deposit MATIC from Polygon
        </CardTitle>
        <CardDescription>
          Send MATIC from your MetaMask to fund your Smart Wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart Wallet Address */}
        <div className="space-y-3">
          <Label>Your Smart Wallet Address</Label>
          <div className="flex items-center gap-2">
            <Input
              value={walletAddress}
              readOnly
              className="font-mono text-sm"
              placeholder="Connect wallet to see address"
            />
            <Button
              onClick={copyAddress}
              variant="outline"
              size="icon"
              disabled={!walletAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is where your MATIC will be sent
          </p>
        </div>

        {/* Network Connection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>MetaMask Network</Label>
            <Badge variant="outline">
              🟣 Polygon Required
            </Badge>
          </div>
          <Button
            onClick={connectToPolygon}
            disabled={isConnecting || !walletAddress}
            className="w-full button-gradient hover-lift"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Polygon...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect MetaMask to Polygon
              </>
            )}
          </Button>
        </div>

        {/* Transfer Amount */}
        <div className="space-y-3">
          <Label htmlFor="amount">MATIC Amount to Send</Label>
          <Input
            id="amount"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.001"
            step="0.001"
            min="0.001"
          />
          <p className="text-xs text-muted-foreground">
            Minimum: 0.001 MATIC (~$0.001 USD)
          </p>
        </div>

        {/* Send Transfer */}
        <Button
          onClick={sendPolygonTransfer}
          disabled={!walletAddress || !depositAmount || parseFloat(depositAmount) < 0.001}
          className="w-full button-gradient hover-lift"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Send {depositAmount} MATIC to Smart Wallet
        </Button>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
            📋 Instructions
          </h4>
          <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
            <li>Make sure you have MATIC in your MetaMask on Polygon network</li>
            <li>Click &quot;Connect MetaMask to Polygon&quot; to switch networks</li>
            <li>Enter the amount of MATIC you want to send</li>
            <li>Click &quot;Send MATIC&quot; and confirm in MetaMask</li>
            <li>Wait for the transaction to confirm</li>
          </ol>
        </div>

        {/* Alternative Options */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <h4 className="font-medium mb-2 text-yellow-700 dark:text-yellow-300">
            💡 Alternative: Get Test ETH
          </h4>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
            If you prefer testnet tokens (free), you can also get Arbitrum Sepolia ETH:
          </p>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="https://faucets.chain.link/arbitrum-sepolia" target="_blank" rel="noopener noreferrer">
                ChainLink Faucet - Free ETH
              </a>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="https://faucet.quicknode.com/arbitrum/sepolia" target="_blank" rel="noopener noreferrer">
                QuickNode Faucet - Free ETH
              </a>
            </Button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            {walletAddress ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <div className="text-sm">
              <div className="font-medium">Smart Wallet</div>
              <div className="text-muted-foreground">
                {walletAddress ? "Ready" : "Not Connected"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div className="text-sm">
              <div className="font-medium">MetaMask</div>
              <div className="text-muted-foreground">
                Switch to Polygon
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}