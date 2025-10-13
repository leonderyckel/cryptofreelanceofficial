"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";

export default function WalletDeploymentTest() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);

  const testWalletDeployment = async () => {
    if (!user) {
      toast({
        title: "❌ User Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDeploymentResult(null);

    try {
      console.log("=== Testing Wallet Deployment ===");
      
      const results: any = {
        timestamp: new Date().toISOString(),
        checks: [],
        walletInfo: {},
      };

      // 1. Check user connection
      results.checks.push({
        name: "User Connection",
        status: "pass",
        message: `Connected as ${user.type}`,
        details: { type: user.type, address: user.address },
      });

      // 2. Check client availability
      if (!client) {
        results.checks.push({
          name: "Smart Account Client",
          status: "fail",
          message: "Client not available",
          details: null,
        });
        setDeploymentResult(results);
        setIsLoading(false);
        return;
      }

      results.checks.push({
        name: "Smart Account Client",
        status: "pass",
        message: "Client available",
        details: { hasAccount: !!client.account },
      });

      // 3. Check account deployment status
      if (!client.account?.address) {
        results.checks.push({
          name: "Account Deployment",
          status: "fail",
          message: "Smart account not deployed",
          details: { needsDeployment: true },
        });
      } else {
        results.checks.push({
          name: "Account Deployment",
          status: "pass",
          message: `Smart account deployed: ${client.account.address}`,
          details: { address: client.account.address },
        });

        // 4. Check if account exists on-chain
        try {
          const code = await client.request({
            method: "eth_getCode",
            params: [client.account.address, "latest"],
          });
          
          const isDeployed = code && code !== "0x" && code.length > 2;
          
          results.checks.push({
            name: "On-Chain Verification",
            status: isDeployed ? "pass" : "fail",
            message: isDeployed 
              ? "Smart contract deployed on-chain" 
              : "No contract code found - wallet not actually deployed",
            details: { 
              code: code?.slice(0, 20) + "...",
              isDeployed,
              codeLength: code?.length 
            },
          });

          // 5. Check account balance
          try {
            const balance = await client.request({
              method: "eth_getBalance",
              params: [client.account.address, "latest"],
            });
            
            const balanceInWei = BigInt(balance);
            const balanceInEth = Number(balanceInWei) / 1e18;
            
            results.checks.push({
              name: "Account Balance",
              status: balanceInWei > 0 ? "pass" : "warning",
              message: `Balance: ${balanceInEth.toFixed(6)} ETH`,
              details: { 
                balance: balance,
                balanceEth: balanceInEth,
                hasETH: balanceInWei > 0
              },
            });
          } catch (balanceError: any) {
            results.checks.push({
              name: "Account Balance",
              status: "fail",
              message: `Could not fetch balance: ${balanceError.message}`,
              details: { error: balanceError.message },
            });
          }

          // 6. Check nonce value (simpler diagnostic)
          try {
            const nonce = await client.request({
              method: "eth_getTransactionCount",
              params: [client.account.address, "latest"]
            });

            results.checks.push({
              name: "Account Nonce",
              status: "pass",
              message: `Current nonce: ${nonce}`,
              details: { 
                nonce,
                note: "Account has been used for transactions if nonce > 0"
              },
            });
          } catch (nonceError: any) {
            results.checks.push({
              name: "Account Nonce",
              status: "fail",
              message: `Could not fetch nonce: ${nonceError.message}`,
              details: { 
                error: nonceError.message,
                suggestion: "This suggests the Smart Wallet may not be properly deployed"
              },
            });
          }

        } catch (onChainError: any) {
          results.checks.push({
            name: "On-Chain Verification",
            status: "fail",
            message: `Could not verify on-chain: ${onChainError.message}`,
            details: { error: onChainError.message },
          });
        }
      }

      // 7. Chain info
      results.checks.push({
        name: "Chain Configuration",
        status: client.chain ? "pass" : "fail",
        message: client.chain 
          ? `Connected to ${client.chain.name} (${client.chain.id})`
          : "No chain information",
        details: client.chain ? {
          name: client.chain.name,
          id: client.chain.id,
          isArbitrumSepolia: client.chain.id === 421614,
          explorer: client.chain.blockExplorers?.default?.url
        } : null,
      });

      setDeploymentResult(results);

      // Show summary
      const failedChecks = results.checks.filter((c: any) => c.status === "fail").length;
      if (failedChecks === 0) {
        toast({
          title: "✅ Deployment Check Complete",
          description: "Found potential issues to investigate",
          variant: "success",
        });
      } else {
        toast({
          title: `⚠️ Found ${failedChecks} Critical Issues`,
          description: "Check the detailed results below",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Deployment test failed:", error);
      
      setDeploymentResult({
        timestamp: new Date().toISOString(),
        checks: [{
          name: "Deployment Test Error",
          status: "fail",
          message: `Test failed: ${error.message}`,
          details: { error: error.message },
        }],
      });

      toast({
        title: "❌ Deployment Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pass: "default",
      warning: "secondary",
      fail: "destructive",
    };
    return variants[status] || "secondary";
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="gradient-text">🔍 Wallet Deployment Diagnostic</CardTitle>
        <CardDescription>
          Deep analysis of Smart Wallet deployment and AA23 errors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={testWalletDeployment}
          disabled={isLoading}
          className="button-gradient hover-lift w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Deep Diagnostic...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Deployment Diagnostic
            </>
          )}
        </Button>

        {deploymentResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Deployment Analysis</h4>
              <Badge variant="outline" className="text-xs">
                {new Date(deploymentResult.timestamp).toLocaleTimeString()}
              </Badge>
            </div>

            <div className="space-y-3">
              {deploymentResult.checks.map((check: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    check.status === 'fail' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' :
                    check.status === 'warning' ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20' :
                    'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                  }`}
                >
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{check.name}</span>
                      <Badge variant={getStatusBadge(check.status)} className="text-xs">
                        {check.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{check.message}</p>
                    
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
                          Technical Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto border">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}

                    {check.name === "Gas Estimation" && check.status === "fail" && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">
                          🎯 This is likely the root cause of your transaction failures!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap mt-6">
              {client?.account?.address && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-lift"
                  onClick={() => window.open(
                    `https://sepolia.arbiscan.io/address/${client.account.address}`,
                    "_blank"
                  )}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="hover-lift"
                onClick={() => window.open("https://www.alchemy.com/faucets/arbitrum-sepolia", "_blank")}
              >
                Get Test ETH
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}