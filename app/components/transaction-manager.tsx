"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Layers,
  Zap,
  RefreshCw,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { formatAddress } from "@/lib/utils";
import { parseEther, parseUnits, formatEther } from "viem";

interface Transaction {
  id: string;
  to: string;
  value: string;
  data: string;
  description: string;
}

interface BatchTransaction {
  transactions: Transaction[];
  description: string;
}

export default function TransactionManager() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  
  // Transaction states
  const [isLoading, setIsLoading] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  
  // Single transaction form
  const [singleTx, setSingleTx] = useState({
    to: "",
    value: "",
    data: "0x",
    gasToken: "ETH",
  });
  
  // Batch transaction form
  const [batchTxs, setBatchTxs] = useState<Transaction[]>([
    { id: "1", to: "", value: "", data: "0x", description: "" }
  ]);
  
  // Gas sponsorship settings
  const [gasSettings, setGasSettings] = useState({
    sponsor: true,
    payWithToken: false,
    tokenAddress: "",
    maxFeePerGas: "",
    maxPriorityFeePerGas: "",
  });

  // Add new transaction to batch
  const addToBatch = () => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      to: "",
      value: "",
      data: "0x",
      description: "",
    };
    setBatchTxs([...batchTxs, newTx]);
  };

  // Remove transaction from batch
  const removeFromBatch = (id: string) => {
    setBatchTxs(batchTxs.filter(tx => tx.id !== id));
  };

  // Update batch transaction
  const updateBatchTx = (id: string, field: keyof Transaction, value: string) => {
    setBatchTxs(batchTxs.map(tx => 
      tx.id === id ? { ...tx, [field]: value } : tx
    ));
  };

  // Send single transaction
  const sendSingleTransaction = async () => {
    if (!client || !singleTx.to) return;
    
    setIsLoading(true);
    try {
      const userOp = {
        target: singleTx.to as `0x${string}`,
        data: singleTx.data as `0x${string}`,
        value: singleTx.value ? parseEther(singleTx.value) : BigInt(0),
      };

      console.log("Sending single transaction:", userOp);
      
      const hash = await client.sendUserOperation({
        uo: userOp,
        ...(gasSettings.sponsor && { 
          // Gas sponsorship enabled through policy
        }),
        ...(gasSettings.payWithToken && gasSettings.tokenAddress && {
          // Pay gas with token
          paymasterAndData: gasSettings.tokenAddress,
        }),
      });

      console.log("Transaction sent:", hash);
      
      // Add to pending transactions
      setPendingTxs(prev => [...prev, {
        hash,
        type: 'single',
        status: 'pending',
        timestamp: Date.now(),
        ...userOp,
      }]);

      // Reset form
      setSingleTx({ to: "", value: "", data: "0x", gasToken: "ETH" });
      
    } catch (error) {
      console.error("Failed to send transaction:", error);
    }
    setIsLoading(false);
  };

  // Send batch transactions
  const sendBatchTransactions = async () => {
    if (!client || batchTxs.length === 0) return;
    
    setIsLoading(true);
    try {
      const userOps = batchTxs
        .filter(tx => tx.to && tx.to.trim() !== "")
        .map(tx => ({
          target: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: tx.value ? parseEther(tx.value) : BigInt(0),
        }));

      if (userOps.length === 0) {
        console.error("No valid transactions to batch");
        setIsLoading(false);
        return;
      }

      console.log("Sending batch transactions:", userOps);
      
      const hash = await client.sendUserOperation({
        uo: userOps,
        ...(gasSettings.sponsor && { 
          // Gas sponsorship enabled through policy
        }),
      });

      console.log('Batch transactions sent successfully:', hash);
      
      // Wait for transaction receipt
      const receipt = await client.waitForUserOperationTransaction(hash);
      console.log('Batch confirmed:', receipt);
      
      // Add to transaction history
      setTxHistory(prev => [{
        hash,
        type: 'batch',
        status: 'confirmed',
        timestamp: Date.now(),
        receipt,
        batchSize: userOps.length,
        transactions: userOps,
      }, ...prev]);

      // Reset batch
      setBatchTxs([{ id: "1", to: "", value: "", data: "0x", description: "" }]);
      
    } catch (error: any) {
      console.error('Batch transaction failed:', error);
      setTxHistory(prev => [{
        hash: 'failed-batch-' + Date.now(),
        type: 'batch',
        status: 'failed',
        timestamp: Date.now(),
        error: error.message || 'Unknown error',
        batchSize: validTxs.length,
      }, ...prev]);
    }
    setIsLoading(false);
  };

  // Simulate transactions (for testing)
  const simulateTransaction = async () => {
    if (!client || !singleTx.to) return;
    
    try {
      // This would use Alchemy's simulation API
      console.log("Simulating transaction...");
      // Implementation would go here
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  // Get transaction status
  const getTransactionStatus = async (hash: string) => {
    if (!client) return;
    
    try {
      // This would check the transaction status
      console.log("Checking transaction status for:", hash);
      // Implementation would go here
    } catch (error) {
      console.error("Failed to get transaction status:", error);
    }
  };

  // Copy transaction hash
  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  // Open transaction in explorer
  const openInExplorer = (hash: string) => {
    if (client?.chain?.blockExplorers?.default?.url) {
      window.open(
        `${client.chain.blockExplorers.default.url}/tx/${hash}`,
        "_blank"
      );
    }
  };

  // Common token addresses for gas payment
  const commonTokens = [
    { symbol: "ETH", address: "0x0000000000000000000000000000000000000000" },
    { symbol: "USDC", address: "0xa0b86a33e6441e32181a85517c0c5e0de5437cb7" },
    { symbol: "USDT", address: "0xfde91708ec37c02bff0b9a0b7d1b5b3e5c5d8c54" },
  ];

  return (
    <div className="space-y-6">
      {/* Transaction Manager Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Advanced Transaction Manager
          </CardTitle>
          <CardDescription>
            Send single transactions, batch multiple operations, and manage gas payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Zap className="h-3 w-3 mr-1" />
                Gas Sponsored
              </Badge>
              <p className="text-xs text-muted-foreground">
                {gasSettings.sponsor ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Layers className="h-3 w-3 mr-1" />
                Batch Ready
              </Badge>
              <p className="text-xs text-muted-foreground">
                {batchTxs.filter(tx => tx.to).length} operations
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
              <p className="text-xs text-muted-foreground">
                {pendingTxs.length} transactions
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Coins className="h-3 w-3 mr-1" />
                Token Pay
              </Badge>
              <p className="text-xs text-muted-foreground">
                {gasSettings.payWithToken ? "Enabled" : "ETH"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Tabs */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single TX</TabsTrigger>
          <TabsTrigger value="batch">Batch TX</TabsTrigger>
          <TabsTrigger value="settings">Gas Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Single Transaction Tab */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Single Transaction</CardTitle>
              <CardDescription>
                Send a single transaction with optional data payload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To Address</Label>
                  <Input
                    id="to"
                    placeholder="0x..."
                    value={singleTx.to}
                    onChange={(e) => setSingleTx({...singleTx, to: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value (ETH)</Label>
                  <Input
                    id="value"
                    placeholder="0.0"
                    type="number"
                    step="0.001"
                    value={singleTx.value}
                    onChange={(e) => setSingleTx({...singleTx, value: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data">Data (Optional)</Label>
                <Textarea
                  id="data"
                  placeholder="0x..."
                  value={singleTx.data}
                  onChange={(e) => setSingleTx({...singleTx, data: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={sendSingleTransaction}
                  disabled={isLoading || !singleTx.to || !client}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Transaction
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={simulateTransaction}
                  disabled={!singleTx.to || !client}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Simulate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Transactions Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Batch Transactions</span>
                <Button onClick={addToBatch} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add TX
                </Button>
              </CardTitle>
              <CardDescription>
                Group multiple transactions into a single operation to save gas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchTxs.map((tx, index) => (
                <div key={tx.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Transaction #{index + 1}</Label>
                    {batchTxs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromBatch(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="To address"
                      value={tx.to}
                      onChange={(e) => updateBatchTx(tx.id, "to", e.target.value)}
                    />
                    <Input
                      placeholder="Value (ETH)"
                      type="number"
                      step="0.001"
                      value={tx.value}
                      onChange={(e) => updateBatchTx(tx.id, "value", e.target.value)}
                    />
                  </div>
                  
                  <Input
                    placeholder="Description (optional)"
                    value={tx.description}
                    onChange={(e) => updateBatchTx(tx.id, "description", e.target.value)}
                  />
                  
                  <Textarea
                    placeholder="Data (0x...)"
                    value={tx.data}
                    onChange={(e) => updateBatchTx(tx.id, "data", e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              
              <Button
                onClick={sendBatchTransactions}
                disabled={isLoading || batchTxs.filter(tx => tx.to).length === 0 || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Batch...
                  </>
                ) : (
                  <>
                    <Layers className="mr-2 h-4 w-4" />
                    Send Batch ({batchTxs.filter(tx => tx.to).length} transactions)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gas Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gas & Fee Settings</CardTitle>
              <CardDescription>
                Configure gas sponsorship and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Gas Sponsorship</Label>
                  <p className="text-sm text-muted-foreground">
                    Use sponsored gas for transactions
                  </p>
                </div>
                <Button
                  variant={gasSettings.sponsor ? "default" : "outline"}
                  onClick={() => setGasSettings({...gasSettings, sponsor: !gasSettings.sponsor})}
                >
                  {gasSettings.sponsor ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Pay Gas with Token</Label>
                  <p className="text-sm text-muted-foreground">
                    Pay transaction fees using ERC-20 tokens
                  </p>
                </div>
                <Button
                  variant={gasSettings.payWithToken ? "default" : "outline"}
                  onClick={() => setGasSettings({...gasSettings, payWithToken: !gasSettings.payWithToken})}
                >
                  {gasSettings.payWithToken ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {gasSettings.payWithToken && (
                <div className="space-y-2">
                  <Label>Payment Token</Label>
                  <Select
                    value={gasSettings.tokenAddress}
                    onValueChange={(value) => setGasSettings({...gasSettings, tokenAddress: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select token for gas payment" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          {token.symbol} - {formatAddress(token.address)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Fee Per Gas (gwei)</Label>
                  <Input
                    placeholder="Auto"
                    value={gasSettings.maxFeePerGas}
                    onChange={(e) => setGasSettings({...gasSettings, maxFeePerGas: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Priority Fee (gwei)</Label>
                  <Input
                    placeholder="Auto"
                    value={gasSettings.maxPriorityFeePerGas}
                    onChange={(e) => setGasSettings({...gasSettings, maxPriorityFeePerGas: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTxs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Send your first transaction to see it here.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingTxs.map((tx, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tx.type === 'batch' ? (
                            <Layers className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {tx.type === 'batch' ? `Batch (${tx.count} ops)` : 'Single TX'}
                          </span>
                          <Badge variant="outline">
                            {tx.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {tx.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {tx.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTxHash(tx.hash)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInExplorer(tx.hash)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatAddress(tx.hash)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}