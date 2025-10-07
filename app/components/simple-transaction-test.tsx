"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";
import { parseEther } from "viem";

export default function SimpleTransactionTest() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [amount, setAmount] = useState("0.001");
  const [recipient, setRecipient] = useState("0x0000000000000000000000000000000000000001");

  const testBasicTransaction = async () => {
    if (!client?.account?.address) {
      toast({
        title: "❌ Wallet Not Ready",
        description: "Please deploy your Smart Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    try {
      console.log("=== Starting Basic Transaction Test ===");
      console.log("Account:", client.account.address);
      console.log("Chain:", client.chain?.name);
      
      // Test with minimal UserOp without gas sponsorship
      const userOp = {
        target: recipient as `0x${string}`,
        data: "0x" as `0x${string}`,
        value: parseEther(amount),
      };

      console.log("UserOp:", userOp);

      // Send without gas sponsorship to avoid paymaster issues
      const hash = await client.sendUserOperation({
        uo: userOp,
        // Explicitly disable gas sponsorship
        overrides: {
          paymasterAndData: "0x",
        },
      });

      console.log("Transaction hash:", hash);
      
      setTxResult({
        status: 'pending',
        hash,
        type: 'basic',
        amount,
        recipient,
      });

      toast({
        title: "✅ Transaction Sent!",
        description: `Transaction submitted with hash: ${String(hash).slice(0, 10)}...`,
        variant: "success",
      });

      // Wait for confirmation
      try {
        const receipt = await client.waitForUserOperationTransaction(hash);
        console.log("Transaction confirmed:", receipt);
        
        setTxResult((prev: any) => ({
          ...prev,
          status: 'confirmed',
          receipt,
        }));

        toast({
          title: "🎉 Transaction Confirmed!",
          description: `${amount} ETH sent successfully`,
          variant: "success",
        });
      } catch (confirmError) {
        console.error("Confirmation failed:", confirmError);
        setTxResult((prev: any) => ({
          ...prev,
          status: 'failed',
          error: 'Failed to confirm transaction',
        }));
      }

    } catch (error: any) {
      console.error("=== Transaction Failed ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      
      let errorMessage = "Unknown error";
      
      if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance. Get test ETH from faucets first.";
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "Transaction reverted. Try a smaller amount or check recipient address.";
      } else if (error.message?.includes("nonce")) {
        errorMessage = "Nonce error. Try refreshing the page and retry.";
      } else if (error.message?.includes("gas")) {
        errorMessage = "Gas estimation failed. Try without gas sponsorship.";
      } else {
        errorMessage = error.message || "Transaction failed";
      }
      
      setTxResult({
        status: 'failed',
        error: errorMessage,
        fullError: error.message,
        amount,
        recipient,
      });

      toast({
        title: "❌ Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const testSelfTransaction = async () => {
    if (!client?.account?.address) {
      toast({
        title: "❌ Wallet Not Ready",
        description: "Please deploy your Smart Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    try {
      console.log("=== Starting Self Transaction Test ===");
      
      // Self-transaction with 0 value (safest option)
      const userOp = {
        target: client.account.address,
        data: "0x" as `0x${string}`,
        value: BigInt(0),
      };

      console.log("Self UserOp:", userOp);

      const hash = await client.sendUserOperation({
        uo: userOp,
        // Explicitly disable gas sponsorship for self-transaction
        overrides: {
          paymasterAndData: "0x",
        },
      });

      console.log("Self transaction hash:", hash);
      
      setTxResult({
        status: 'pending',
        hash,
        type: 'self',
        amount: '0',
        recipient: client.account.address,
      });

      toast({
        title: "✅ Self Transaction Sent!",
        description: "Testing wallet functionality...",
        variant: "success",
      });

      // Wait for confirmation
      try {
        const receipt = await client.waitForUserOperationTransaction(hash);
        console.log("Self transaction confirmed:", receipt);
        
        setTxResult((prev: any) => ({
          ...prev,
          status: 'confirmed',
          receipt,
        }));

        toast({
          title: "🎉 Self Transaction Confirmed!",
          description: "Your Smart Wallet is working correctly",
          variant: "success",
        });
      } catch (confirmError) {
        console.error("Self transaction confirmation failed:", confirmError);
      }

    } catch (error: any) {
      console.error("=== Self Transaction Failed ===");
      console.error("Error:", error);
      
      setTxResult({
        status: 'failed',
        error: error.message || "Self transaction failed",
        type: 'self',
      });

      toast({
        title: "❌ Self Transaction Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="gradient-text">🔧 Advanced Transaction Testing</CardTitle>
          <CardDescription>
            Detailed transaction testing with better error diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Self Transaction Test */}
          <div className="space-y-3">
            <h4 className="font-medium">1. Self Transaction Test (Safest)</h4>
            <p className="text-sm text-muted-foreground">
              Send a 0-value transaction to yourself to test basic functionality
            </p>
            <Button
              onClick={testSelfTransaction}
              disabled={isLoading}
              className="button-gradient hover-lift"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Self Transaction
            </Button>
          </div>

          {/* Basic Transfer Test */}
          <div className="space-y-3">
            <h4 className="font-medium">2. Basic Transfer Test</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.001"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              onClick={testBasicTransaction}
              disabled={isLoading || !amount || !recipient}
              className="button-gradient hover-lift w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Basic Transfer
            </Button>
          </div>

          {/* Transaction Result */}
          {txResult && (
            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {txResult.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                {txResult.status === 'confirmed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {txResult.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                <h5 className="font-medium">Transaction Result</h5>
                <Badge variant={
                  txResult.status === 'confirmed' ? 'default' : 
                  txResult.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {txResult.status}
                </Badge>
              </div>
              
              {txResult.hash && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Hash:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{String(txResult.hash).slice(0, 10)}...{String(txResult.hash).slice(-8)}</span>
                      {client?.chain?.blockExplorers?.default?.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => window.open(
                            `${client?.chain?.blockExplorers?.default?.url}/tx/${txResult.hash}`,
                            "_blank"
                          )}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{txResult.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{txResult.amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-mono">{txResult.recipient?.slice(0, 10)}...{txResult.recipient?.slice(-8)}</span>
                  </div>
                </div>
              )}
              
              {txResult.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error:</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{txResult.error}</p>
                  {txResult.fullError && txResult.fullError !== txResult.error && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Full error details</summary>
                      <p className="text-xs text-red-500 mt-1 font-mono">{txResult.fullError}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg text-sm">
            <h6 className="font-medium mb-2">Debug Information:</h6>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Wallet Address:</span>
                <span className="font-mono">{client?.account?.address || "Not deployed"}</span>
              </div>
              <div className="flex justify-between">
                <span>Chain:</span>
                <span>{client?.chain?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span>User Type:</span>
                <span>{user?.type || "Unknown"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}