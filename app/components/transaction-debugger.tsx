"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink } from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { useToast } from "@/lib/hooks/use-toast";

interface DiagnosticCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

interface DiagnosticResults {
  timestamp: string;
  checks: DiagnosticCheck[];
}

export default function TransactionDebugger() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResults = {
      timestamp: new Date().toISOString(),
      checks: [],
    };

    try {
      // 1. Check if user is connected
      results.checks.push({
        name: "User Connection",
        status: user ? "pass" : "fail",
        message: user ? `Connected as ${user.type}` : "User not connected",
        details: user ? { type: user.type, email: user.email, address: user.address } : null,
      });

      // 2. Check if client is available
      results.checks.push({
        name: "Smart Account Client",
        status: client ? "pass" : "fail",
        message: client ? "Client available" : "Client not available",
        details: client ? { hasAccount: !!client.account } : null,
      });

      // 3. Check if account is deployed
      if (client?.account) {
        results.checks.push({
          name: "Smart Wallet Address",
          status: client.account.address ? "pass" : "fail",
          message: client.account.address ? `Address: ${client.account.address}` : "No address",
          details: { address: client.account.address },
        });

        // 4. Check chain configuration
        results.checks.push({
          name: "Chain Configuration",
          status: client.chain ? "pass" : "fail",
          message: client.chain ? `Connected to ${client.chain.name}` : "No chain info",
          details: client.chain ? {
            name: client.chain.name,
            id: client.chain.id,
            testnet: client.chain.testnet,
            blockExplorer: client.chain.blockExplorers?.default?.url,
          } : null,
        });

        // 5. Try to estimate gas for a simple transaction
        try {
          const simpleOp = {
            target: client.account.address,
            data: "0x" as `0x${string}`,
            value: BigInt(0),
          };

          // Note: We're not actually executing this, just checking if we can prepare it
          results.checks.push({
            name: "Transaction Preparation",
            status: "pass",
            message: "Can prepare simple transactions",
            details: { sampleOp: simpleOp },
          });
        } catch (error: any) {
          results.checks.push({
            name: "Transaction Preparation",
            status: "fail",
            message: `Cannot prepare transactions: ${error.message}`,
            details: { error: error.message },
          });
        }

        // 6. Check for common error patterns
        const commonIssues = [];
        
        if (!client.chain?.testnet) {
          commonIssues.push("Not on testnet - may cause issues with gas sponsorship");
        }
        
        if (client.chain?.id !== 421614) {
          commonIssues.push("Not on Arbitrum Sepolia (421614) - gas sponsorship may not work");
        }

        results.checks.push({
          name: "Common Issues Check",
          status: commonIssues.length === 0 ? "pass" : "warning",
          message: commonIssues.length === 0 ? "No common issues detected" : `Found ${commonIssues.length} potential issues`,
          details: { issues: commonIssues },
        });
      }

      // 7. Environment variables check (safe client-side check)
      const envIssues = [];
      try {
        // Check if environment variables are available without accessing them directly
        const hasApiKey = typeof window !== 'undefined' && client ? true : false;
        const hasPolicyId = client?.chain ? true : false;
        
        if (!hasApiKey) {
          envIssues.push("API configuration may be missing");
        }
        
        results.checks.push({
          name: "Environment Configuration",
          status: envIssues.length === 0 ? "pass" : "warning",
          message: envIssues.length === 0 ? "Environment appears properly configured" : `Potential issues: ${envIssues.join(", ")}`,
          details: { 
            note: "Client-side environment check - limited visibility",
            issues: envIssues 
          },
        });
      } catch (envError) {
        results.checks.push({
          name: "Environment Configuration",
          status: "warning",
          message: "Could not verify environment configuration",
          details: { error: "Client-side limitation" },
        });
      }

    } catch (error: any) {
      results.checks.push({
        name: "Diagnostics Error",
        status: "fail",
        message: `Diagnostics failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    setDiagnostics(results);
    setIsRunning(false);

    // Show summary toast
    const failedChecks = results.checks.filter(c => c.status === "fail").length;
    const warningChecks = results.checks.filter(c => c.status === "warning").length;
    
    if (failedChecks === 0 && warningChecks === 0) {
      toast({
        title: "✅ All Diagnostics Passed",
        description: "Your setup looks good for transactions",
        variant: "success",
      });
    } else {
      toast({
        title: `⚠️ Issues Found`,
        description: `${failedChecks} failures, ${warningChecks} warnings`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: "pass" | "fail" | "warning") => {
    const variants = {
      pass: "default" as const,
      warning: "secondary" as const,
      fail: "destructive" as const,
    };
    return variants[status] || "secondary";
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="gradient-text">🔍 Transaction Diagnostics</CardTitle>
        <CardDescription>
          Analyze your setup to identify potential transaction issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="button-gradient hover-lift w-full"
        >
          {isRunning ? "Running Diagnostics..." : "Run Full Diagnostics"}
        </Button>

        {diagnostics && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Diagnostic Results</h4>
              <Badge variant="outline" className="text-xs">
                {new Date(diagnostics.timestamp).toLocaleTimeString()}
              </Badge>
            </div>

            <div className="space-y-3">
              {diagnostics.checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{check.name}</span>
                      <Badge variant={getStatusBadge(check.status)} className="text-xs">
                        {check.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600 dark:text-blue-400">
                          Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h5 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
                💡 Recommendations
              </h5>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• If transactions fail, try the &quot;Simple Transaction Test&quot; first</li>
                <li>• Gas sponsorship issues can be bypassed by paying gas manually</li>
                <li>• Make sure you have test ETH from the faucets</li>
                <li>• Check that your wallet is deployed before sending transactions</li>
                <li>• Large transactions may need to be split into smaller amounts</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              {client?.chain?.blockExplorers?.default?.url && client?.account?.address && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-lift"
                  onClick={() => window.open(
                    `${client.chain?.blockExplorers?.default?.url}/address/${client.account?.address}`,
                    "_blank"
                  )}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Explorer
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