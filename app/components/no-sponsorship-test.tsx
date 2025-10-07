"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";
import { parseEther } from "viem";

export default function NoSponsorshipTest() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);

  const testWithoutSponsorship = async () => {
    if (!client?.account?.address) {
      toast({
        title: "❌ Smart Wallet Not Ready",
        description: "Please deploy your Smart Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    try {
      console.log("=== Testing Without Gas Sponsorship ===");
      console.log("Account:", client.account.address);
      console.log("Chain:", client.chain?.name);

      // Simple self-transaction with 0 value
      const userOp = {
        target: client.account.address,
        data: "0x" as `0x${string}`,
        value: BigInt(0),
      };

      console.log("UserOp (no sponsorship):", userOp);

      // Send with manual gas payment
      const hash = await client.sendUserOperation({
        uo: userOp,
        // Force no paymaster
        overrides: {
          paymasterAndData: "0x",
        },
      });

      console.log("Transaction hash (no sponsorship):", hash);
      
      setTxResult({
        status: 'pending',
        hash,
        type: 'no-sponsorship',
        amount: '0',
        recipient: client.account.address,
      });

      toast({
        title: "✅ No-Sponsorship Transaction Sent!",
        description: "Transaction sent without gas sponsorship",
        variant: "success",
      });

      // Wait for confirmation
      try {
        const receipt = await client.waitForUserOperationTransaction(hash);
        console.log("No-sponsorship transaction confirmed:", receipt);
        
        setTxResult((prev: any) => ({
          ...prev,
          status: 'confirmed',
          receipt,
        }));

        toast({
          title: "🎉 No-Sponsorship Transaction Confirmed!",
          description: "Transaction successful without paymaster",
          variant: "success",
        });
      } catch (confirmError) {
        console.error("No-sponsorship transaction confirmation failed:", confirmError);
        setTxResult((prev: any) => ({
          ...prev,
          status: 'failed',
          error: 'Failed to confirm transaction',
        }));
      }

    } catch (error: any) {
      console.error("=== No-Sponsorship Transaction Failed ===");
      console.error("Error:", error);
      
      let errorMessage = "Unknown error";
      
      if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance. You need ETH to pay for gas without sponsorship.";
      } else if (error.message?.includes("AA23")) {
        errorMessage = "Paymaster error avoided - this test bypasses gas sponsorship.";
      } else if (error.message?.includes("not deployed")) {
        errorMessage = "Smart account needs to be deployed first.";
      } else {
        errorMessage = error.message || "Transaction failed";
      }
      
      setTxResult({
        status: 'failed',
        error: errorMessage,
        fullError: error.message,
        type: 'no-sponsorship',
      });

      toast({
        title: "❌ No-Sponsorship Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="gradient-text">💰 No Gas Sponsorship Test</CardTitle>
        <CardDescription>
          Test transactions by paying gas directly (bypasses AA23 paymaster errors)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test without gas sponsorship */}
        <div className="space-y-3">
          <h4 className="font-medium">Direct Gas Payment Test</h4>
          <p className="text-sm text-muted-foreground">
            Send transaction by paying gas directly, avoiding paymaster issues completely
          </p>
          <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
            ⚠️ <strong>Note:</strong> You need actual ETH in your Smart Wallet to pay for gas
          </p>
          <Button
            onClick={testWithoutSponsorship}
            disabled={isLoading}
            className="button-gradient hover-lift w-full"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Without Gas Sponsorship
          </Button>
        </div>

        {/* Transaction Result */}
        {txResult && (
          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              {txResult.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
              {txResult.status === 'confirmed' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {txResult.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <h5 className="font-medium">No-Sponsorship Test Result</h5>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => window.open(
                        `https://sepolia.arbiscan.io/tx/${txResult.hash}`,
                        "_blank"
                      )}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{txResult.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Payment:</span>
                  <span className="text-orange-600">Direct (No Sponsorship)</span>
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

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h6 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
            💡 About This Test
          </h6>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Bypasses all paymaster/gas sponsorship systems</li>
            <li>• Requires ETH in your Smart Wallet for gas fees</li>
            <li>• Helps diagnose if the issue is with gas sponsorship</li>
            <li>• Should work if you have sufficient ETH balance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}