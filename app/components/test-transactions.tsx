"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Coins, TestTube, Zap } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";
import { parseEther } from "viem";

export default function TestTransactions() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Test addresses for Arbitrum Sepolia
  const testRecipient = "0x0000000000000000000000000000000000000001"; // Burn address for testing
  const faucetUrls = {
    "Arbitrum Sepolia ETH": "https://faucet.quicknode.com/arbitrum/sepolia",
    "Alternative Faucet": "https://www.alchemy.com/faucets/arbitrum-sepolia",
    "ChainLink Faucet": "https://faucets.chain.link/arbitrum-sepolia"
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
    try {
      // Self-transaction with 0 value (should always work)
      const userOp = {
        target: client.account.address,
        data: "0x",
        value: BigInt(0),
      };

      console.log("Testing self-transaction:", userOp);
      
      const hash = await client.sendUserOperation({
        uo: userOp,
        account: client.account,
      });

      console.log("Self-transaction sent:", hash);
      
      // Wait for confirmation
      const receipt = await client.waitForUserOperationTransaction(hash);
      console.log("Self-transaction confirmed:", receipt);

      toast({
        title: "✅ Self-Transaction Success!",
        description: "Your Smart Wallet is working correctly",
        variant: "success",
      });

    } catch (error: any) {
      console.error("Self-transaction failed:", error);
      toast({
        title: "❌ Self-Transaction Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const testSmallTransfer = async () => {
    if (!client?.account?.address) {
      toast({
        title: "❌ Wallet Not Ready", 
        description: "Please deploy your Smart Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Very small transfer (0.001 ETH) to test address
      const userOp = {
        target: testRecipient as `0x${string}`,
        data: "0x",
        value: parseEther("0.001"), // 0.001 ETH
      };

      console.log("Testing small transfer:", userOp);
      
      const hash = await client.sendUserOperation({
        uo: userOp,
        account: client.account,
      });

      console.log("Small transfer sent:", hash);
      
      // Wait for confirmation
      const receipt = await client.waitForUserOperationTransaction(hash);
      console.log("Small transfer confirmed:", receipt);

      toast({
        title: "✅ Transfer Success!",
        description: "0.001 ETH sent successfully with gas sponsorship",
        variant: "success",
      });

    } catch (error: any) {
      console.error("Small transfer failed:", error);
      let errorMessage = error.message || "Unknown error";
      
      if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance. Use the faucets below to get test ETH.";
      }
      
      toast({
        title: "❌ Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const testBatchTransaction = async () => {
    if (!client?.account?.address) {
      toast({
        title: "❌ Wallet Not Ready",
        description: "Please deploy your Smart Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Batch: self-transaction + small transfer
      const userOps = [
        {
          target: client.account.address,
          data: "0x",
          value: BigInt(0),
        },
        {
          target: testRecipient as `0x${string}`,
          data: "0x",
          value: parseEther("0.0001"), // Very small amount
        }
      ];

      console.log("Testing batch transaction:", userOps);
      
      const hash = await client.sendUserOperation({
        uo: userOps,
        account: client.account,
      });

      console.log("Batch transaction sent:", hash);
      
      // Wait for confirmation
      const receipt = await client.waitForUserOperationTransaction(hash);
      console.log("Batch confirmed:", receipt);

      toast({
        title: "✅ Batch Transaction Success!",
        description: "Multiple operations executed in one transaction",
        variant: "success",
      });

    } catch (error: any) {
      console.error("Batch transaction failed:", error);
      let errorMessage = error.message || "Unknown error";
      
      if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance. Use the faucets below to get test ETH.";
      }
      
      toast({
        title: "❌ Batch Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Faucet Section */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Get Test Funds
          </CardTitle>
          <CardDescription>
            You need test ETH on Arbitrum Sepolia to send transactions. Use these faucets:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(faucetUrls).map(([name, url]) => (
            <Button
              key={name}
              variant="outline"
              className="w-full justify-between hover-lift"
              onClick={() => window.open(url, "_blank")}
            >
              <span>{name}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          ))}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Your Wallet Address:</strong> {client?.account?.address || "Deploy wallet first"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Transactions */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Transactions
          </CardTitle>
          <CardDescription>
            Test different types of transactions to verify everything works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Self Transaction */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Self-Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Send transaction to yourself (no ETH required)
              </p>
            </div>
            <Button
              onClick={testSelfTransaction}
              disabled={isLoading}
              className="button-gradient hover-lift"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>

          {/* Small Transfer */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Small Transfer</h4>
              <p className="text-sm text-muted-foreground">
                Send 0.001 ETH (requires test funds)
              </p>
            </div>
            <Button
              onClick={testSmallTransfer}
              disabled={isLoading}
              className="button-gradient hover-lift"
            >
              <Coins className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>

          {/* Batch Transaction */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Batch Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Multiple operations in one transaction
              </p>
            </div>
            <Button
              onClick={testBatchTransaction}
              disabled={isLoading}
              className="button-gradient hover-lift"
            >
              <Zap className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>

          {user && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Status:</strong> Connected as {user.type === 'eoa' ? 'EOA' : 'Smart Account'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Gas sponsorship is enabled - transactions should be free!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="text-lg">🔧 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <p>First, ensure your Smart Wallet is deployed (check the Overview tab)</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <p>Test the self-transaction first (doesn&apos;t require ETH)</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <p>Get test ETH from the faucets above</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <p>Test small transfers and batch transactions</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">5</Badge>
            <p>All transactions should benefit from gas sponsorship</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}