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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Key,
  Clock,
  Shield,
  Activity,
  Settings,
  Plus,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Zap,
  Lock,
  Unlock,
  Timer,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { formatAddress } from "@/lib/utils";
import { parseEther, parseUnits } from "viem";

interface SessionKey {
  id: string;
  address: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  lastUsed?: number;
  usageCount: number;
  createdBy: string;
}

interface Permission {
  type: "transfer" | "contract_call" | "token_approval" | "nft_transfer" | "custom";
  target?: string;
  selector?: string;
  maxValue?: string;
  maxGas?: string;
  description: string;
}

interface SessionActivity {
  id: string;
  sessionKeyId: string;
  action: string;
  target: string;
  value: string;
  gasUsed: string;
  timestamp: number;
  status: "success" | "failed" | "pending";
  txHash?: string;
}

interface GasPolicy {
  id: string;
  name: string;
  description: string;
  maxGasPerTx: string;
  maxGasPerDay: string;
  allowedContracts: string[];
  isActive: boolean;
}

export default function SessionKeysManager() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [gasPolicies, setGasPolicies] = useState<GasPolicy[]>([]);
  const [selectedKey, setSelectedKey] = useState<SessionKey | null>(null);
  
  // Forms
  const [newSessionKey, setNewSessionKey] = useState({
    name: "",
    description: "",
    duration: "1", // days
    permissions: [] as Permission[],
  });
  
  const [newPermission, setNewPermission] = useState({
    type: "transfer" as const,
    target: "",
    selector: "",
    maxValue: "",
    maxGas: "",
    description: "",
  });

  const [newGasPolicy, setNewGasPolicy] = useState({
    name: "",
    description: "",
    maxGasPerTx: "",
    maxGasPerDay: "",
    allowedContracts: [""],
  });

  // Mock data
  const mockSessionKeys: SessionKey[] = [
    {
      id: "1",
      address: "0x1234567890123456789012345678901234567890",
      name: "Trading Bot",
      description: "Automated trading session for DeFi operations",
      permissions: [
        {
          type: "contract_call",
          target: "0xA0b86a33E6441e32181A85517C0c5E0de5437cb7", // Uniswap
          selector: "0x38ed1739", // swapExactTokensForTokens
          maxValue: "1",
          maxGas: "500000",
          description: "Swap tokens on Uniswap"
        },
        {
          type: "token_approval",
          target: "0xA0b86a33E6441e32181A85517C0c5E0de5437cb7",
          maxValue: "100",
          description: "Approve USDC for trading"
        }
      ],
      createdAt: Date.now() - 86400000,
      expiresAt: Date.now() + 86400000 * 6,
      isActive: true,
      lastUsed: Date.now() - 3600000,
      usageCount: 15,
      createdBy: user?.address || "",
    },
    {
      id: "2",
      address: "0x2345678901234567890123456789012345678901",
      name: "Game Session",
      description: "Session key for blockchain game interactions",
      permissions: [
        {
          type: "nft_transfer",
          target: "0x3456789012345678901234567890123456789012",
          maxGas: "200000",
          description: "Transfer game NFTs"
        }
      ],
      createdAt: Date.now() - 172800000,
      expiresAt: Date.now() + 86400000 * 5,
      isActive: true,
      usageCount: 8,
      createdBy: user?.address || "",
    },
  ];

  const mockActivities: SessionActivity[] = [
    {
      id: "1",
      sessionKeyId: "1",
      action: "Token Swap",
      target: "0xA0b86a33E6441e32181A85517C0c5E0de5437cb7",
      value: "0.5",
      gasUsed: "150000",
      timestamp: Date.now() - 3600000,
      status: "success",
      txHash: "0xabcd1234567890123456789012345678901234567890123456789012345678901234",
    },
    {
      id: "2",
      sessionKeyId: "2",
      action: "NFT Transfer",
      target: "0x3456789012345678901234567890123456789012",
      value: "0",
      gasUsed: "80000",
      timestamp: Date.now() - 7200000,
      status: "success",
      txHash: "0xefgh1234567890123456789012345678901234567890123456789012345678901234",
    },
  ];

  const mockGasPolicies: GasPolicy[] = [
    {
      id: "1",
      name: "Default Policy",
      description: "Standard gas policy for session keys",
      maxGasPerTx: "500000",
      maxGasPerDay: "5000000",
      allowedContracts: ["*"],
      isActive: true,
    },
    {
      id: "2",
      name: "Conservative Policy",
      description: "Low gas limits for testing",
      maxGasPerTx: "100000",
      maxGasPerDay: "1000000",
      allowedContracts: ["0xA0b86a33E6441e32181A85517C0c5E0de5437cb7"],
      isActive: false,
    },
  ];

  // Load data
  useEffect(() => {
    if (client?.account?.address) {
      loadSessionKeys();
      loadActivities();
      loadGasPolicies();
    }
  }, [client?.account?.address]);

  const loadSessionKeys = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would query the session key plugin
      setSessionKeys(mockSessionKeys);
    } catch (error) {
      console.error("Failed to load session keys:", error);
    }
    setIsLoading(false);
  };

  const loadActivities = async () => {
    try {
      // In a real app, this would query session activity events
      setActivities(mockActivities);
    } catch (error) {
      console.error("Failed to load activities:", error);
    }
  };

  const loadGasPolicies = async () => {
    try {
      // In a real app, this would query gas policies
      setGasPolicies(mockGasPolicies);
    } catch (error) {
      console.error("Failed to load gas policies:", error);
    }
  };

  // Create session key
  const createSessionKey = async () => {
    if (!client || !newSessionKey.name || newSessionKey.permissions.length === 0) return;
    
    setIsLoading(true);
    try {
      const expiresAt = Date.now() + (parseInt(newSessionKey.duration) * 24 * 60 * 60 * 1000);
      
      // This would call the session key plugin to create a new session key
      console.log("Creating session key:", {
        name: newSessionKey.name,
        permissions: newSessionKey.permissions,
        expiresAt,
      });
      
      // Generate a new key pair for the session
      // Implementation would go here
      
      // Reset form
      setNewSessionKey({
        name: "",
        description: "",
        duration: "1",
        permissions: [],
      });
      
      await loadSessionKeys();
      
    } catch (error) {
      console.error("Failed to create session key:", error);
    }
    setIsLoading(false);
  };

  // Revoke session key
  const revokeSessionKey = async (keyId: string) => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      console.log("Revoking session key:", keyId);
      
      // This would call the session key plugin to revoke the key
      // Implementation would go here
      
      // Update local state
      setSessionKeys(keys => keys.map(key => 
        key.id === keyId ? { ...key, isActive: false } : key
      ));
      
    } catch (error) {
      console.error("Failed to revoke session key:", error);
    }
    setIsLoading(false);
  };

  // Add permission to new session key
  const addPermission = () => {
    if (!newPermission.type || !newPermission.description) return;
    
    const permission: Permission = {
      type: newPermission.type,
      target: newPermission.target || undefined,
      selector: newPermission.selector || undefined,
      maxValue: newPermission.maxValue || undefined,
      maxGas: newPermission.maxGas || undefined,
      description: newPermission.description,
    };
    
    setNewSessionKey({
      ...newSessionKey,
      permissions: [...newSessionKey.permissions, permission],
    });
    
    setNewPermission({
      type: "transfer",
      target: "",
      selector: "",
      maxValue: "",
      maxGas: "",
      description: "",
    });
  };

  // Remove permission
  const removePermission = (index: number) => {
    setNewSessionKey({
      ...newSessionKey,
      permissions: newSessionKey.permissions.filter((_, i) => i !== index),
    });
  };

  // Create gas policy
  const createGasPolicy = async () => {
    if (!newGasPolicy.name || !newGasPolicy.maxGasPerTx) return;
    
    setIsLoading(true);
    try {
      console.log("Creating gas policy:", newGasPolicy);
      
      // This would create a new gas policy
      // Implementation would go here
      
      setNewGasPolicy({
        name: "",
        description: "",
        maxGasPerTx: "",
        maxGasPerDay: "",
        allowedContracts: [""],
      });
      
      await loadGasPolicies();
      
    } catch (error) {
      console.error("Failed to create gas policy:", error);
    }
    setIsLoading(false);
  };

  const getKeyStatus = (key: SessionKey) => {
    if (!key.isActive) return { status: "Revoked", variant: "destructive" as const, icon: Lock };
    if (key.expiresAt < Date.now()) return { status: "Expired", variant: "destructive" as const, icon: Timer };
    if (key.expiresAt < Date.now() + 86400000) return { status: "Expiring Soon", variant: "secondary" as const, icon: AlertTriangle };
    return { status: "Active", variant: "default" as const, icon: CheckCircle };
  };

  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Session Keys & Automation
          </CardTitle>
          <CardDescription>
            Manage automated transactions with secure session keys and gas policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Key className="h-3 w-3 mr-1" />
                Active Keys
              </Badge>
              <p className="text-xs text-muted-foreground">
                {sessionKeys.filter(k => k.isActive && k.expiresAt > Date.now()).length} of {sessionKeys.length}
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Activity className="h-3 w-3 mr-1" />
                Today's Usage
              </Badge>
              <p className="text-xs text-muted-foreground">
                {activities.filter(a => a.timestamp > Date.now() - 86400000).length} transactions
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Zap className="h-3 w-3 mr-1" />
                Gas Saved
              </Badge>
              <p className="text-xs text-muted-foreground">
                {activities.reduce((sum, a) => sum + parseInt(a.gasUsed), 0).toLocaleString()} gas
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Shield className="h-3 w-3 mr-1" />
                Policies
              </Badge>
              <p className="text-xs text-muted-foreground">
                {gasPolicies.filter(p => p.isActive).length} active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">Session Keys</TabsTrigger>
          <TabsTrigger value="create">Create Key</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="policies">Gas Policies</TabsTrigger>
        </TabsList>

        {/* Session Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Session Keys</CardTitle>
              <CardDescription>
                Manage your active session keys and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No session keys found. Create your first session key to enable automation.
                </p>
              ) : (
                <div className="space-y-4">
                  {sessionKeys.map((key) => {
                    const status = getKeyStatus(key);
                    const StatusIcon = status.icon;
                    const timeLeft = key.expiresAt - Date.now();
                    
                    return (
                      <Card key={key.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{key.name}</h3>
                              <Badge variant={status.variant} className="text-xs">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {key.permissions.length} permissions
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {key.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium">Address:</span><br />
                                {formatAddress(key.address)}
                              </div>
                              <div>
                                <span className="font-medium">Usage:</span><br />
                                {key.usageCount} transactions
                              </div>
                              <div>
                                <span className="font-medium">Last Used:</span><br />
                                {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                              </div>
                              <div>
                                <span className="font-medium">Expires:</span><br />
                                {timeLeft > 0 ? formatDuration(timeLeft) : "Expired"}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedKey(key)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {key.isActive && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => revokeSessionKey(key.id)}
                                disabled={isLoading}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Permissions Preview */}
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-xs font-medium">Permissions</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {key.permissions.slice(0, 3).map((perm, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {perm.type}: {perm.description}
                              </Badge>
                            ))}
                            {key.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{key.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Key Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Session Key</CardTitle>
              <CardDescription>
                Set up automated transactions with specific permissions and time limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input
                      placeholder="e.g., Trading Bot"
                      value={newSessionKey.name}
                      onChange={(e) => setNewSessionKey({...newSessionKey, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Days)</Label>
                    <Select
                      value={newSessionKey.duration}
                      onValueChange={(value) => setNewSessionKey({...newSessionKey, duration: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">1 Week</SelectItem>
                        <SelectItem value="30">1 Month</SelectItem>
                        <SelectItem value="90">3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what this session key will be used for"
                    value={newSessionKey.description}
                    onChange={(e) => setNewSessionKey({...newSessionKey, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Permissions</Label>
                
                {/* Add Permission Form */}
                <Card className="p-4">
                  <Label className="text-sm font-medium">Add Permission</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newPermission.type}
                        onValueChange={(value: any) => setNewPermission({...newPermission, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">ETH Transfer</SelectItem>
                          <SelectItem value="contract_call">Contract Call</SelectItem>
                          <SelectItem value="token_approval">Token Approval</SelectItem>
                          <SelectItem value="nft_transfer">NFT Transfer</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Contract (Optional)</Label>
                      <Input
                        placeholder="0x..."
                        value={newPermission.target}
                        onChange={(e) => setNewPermission({...newPermission, target: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Max Value (ETH)</Label>
                      <Input
                        placeholder="1.0"
                        type="number"
                        step="0.001"
                        value={newPermission.maxValue}
                        onChange={(e) => setNewPermission({...newPermission, maxValue: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Gas</Label>
                      <Input
                        placeholder="500000"
                        type="number"
                        value={newPermission.maxGas}
                        onChange={(e) => setNewPermission({...newPermission, maxGas: e.target.value})}
                      />
                    </div>
                  </div>

                  {newPermission.type === "contract_call" && (
                    <div className="space-y-2 mt-4">
                      <Label>Function Selector</Label>
                      <Input
                        placeholder="0x..."
                        value={newPermission.selector}
                        onChange={(e) => setNewPermission({...newPermission, selector: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    <Label>Description</Label>
                    <Input
                      placeholder="What this permission allows"
                      value={newPermission.description}
                      onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                    />
                  </div>

                  <Button
                    onClick={addPermission}
                    disabled={!newPermission.type || !newPermission.description}
                    className="w-full mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Permission
                  </Button>
                </Card>

                {/* Current Permissions */}
                {newSessionKey.permissions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Permissions ({newSessionKey.permissions.length})</Label>
                    <div className="space-y-2">
                      {newSessionKey.permissions.map((perm, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{perm.type}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              {perm.target && <span>Target: {formatAddress(perm.target)}</span>}
                              {perm.maxValue && <span>Max: {perm.maxValue} ETH</span>}
                              {perm.maxGas && <span>Gas: {perm.maxGas}</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePermission(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={createSessionKey}
                disabled={isLoading || !newSessionKey.name || newSessionKey.permissions.length === 0 || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Create Session Key
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Activity</CardTitle>
              <CardDescription>
                Track all transactions performed by your session keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet. Your session key transactions will appear here.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Session Key</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Gas Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const sessionKey = sessionKeys.find(k => k.id === activity.sessionKeyId);
                      
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">{activity.action}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{sessionKey?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {formatAddress(sessionKey?.address || "")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatAddress(activity.target)}
                          </TableCell>
                          <TableCell>{activity.value} ETH</TableCell>
                          <TableCell>{parseInt(activity.gasUsed).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              activity.status === "success" ? "default" :
                              activity.status === "failed" ? "destructive" : "secondary"
                            }>
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(activity.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Copy className="h-3 w-3" />
                              </Button>
                              {activity.txHash && (
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gas Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gas Policies</CardTitle>
              <CardDescription>
                Configure gas limits and spending controls for session keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Policy Form */}
              <Card className="p-4">
                <Label className="text-sm font-medium">Create New Policy</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>Policy Name</Label>
                    <Input
                      placeholder="e.g., Conservative Policy"
                      value={newGasPolicy.name}
                      onChange={(e) => setNewGasPolicy({...newGasPolicy, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Policy description"
                      value={newGasPolicy.description}
                      onChange={(e) => setNewGasPolicy({...newGasPolicy, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Max Gas Per Transaction</Label>
                    <Input
                      placeholder="500000"
                      type="number"
                      value={newGasPolicy.maxGasPerTx}
                      onChange={(e) => setNewGasPolicy({...newGasPolicy, maxGasPerTx: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Gas Per Day</Label>
                    <Input
                      placeholder="5000000"
                      type="number"
                      value={newGasPolicy.maxGasPerDay}
                      onChange={(e) => setNewGasPolicy({...newGasPolicy, maxGasPerDay: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  onClick={createGasPolicy}
                  disabled={isLoading || !newGasPolicy.name || !newGasPolicy.maxGasPerTx}
                  className="w-full mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Policy
                </Button>
              </Card>

              {/* Existing Policies */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Existing Policies</Label>
                {gasPolicies.map((policy) => (
                  <Card key={policy.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{policy.name}</h3>
                          <Badge variant={policy.isActive ? "default" : "secondary"}>
                            {policy.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {policy.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Max Gas/TX:</span> {parseInt(policy.maxGasPerTx).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Max Gas/Day:</span> {parseInt(policy.maxGasPerDay).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Switch
                          checked={policy.isActive}
                          onCheckedChange={(checked) => {
                            // Toggle policy active state
                            setGasPolicies(policies => policies.map(p =>
                              p.id === policy.id ? { ...p, isActive: checked } : p
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Key Details Modal */}
      {selectedKey && (
        <Dialog open={!!selectedKey} onOpenChange={() => setSelectedKey(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedKey.name}</DialogTitle>
              <DialogDescription>
                Session Key Details and Permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm mt-1 font-mono">{formatAddress(selectedKey.address)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className="mt-1">
                    {getKeyStatus(selectedKey).status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm mt-1">{new Date(selectedKey.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expires</Label>
                  <p className="text-sm mt-1">{new Date(selectedKey.expiresAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedKey.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Permissions ({selectedKey.permissions.length})</Label>
                <div className="space-y-2 mt-2">
                  {selectedKey.permissions.map((perm, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{perm.type}</Badge>
                        {perm.maxValue && (
                          <span className="text-xs text-muted-foreground">
                            Max: {perm.maxValue} ETH
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{perm.description}</p>
                      {perm.target && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Target: {formatAddress(perm.target)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
                {selectedKey.isActive && (
                  <Button
                    variant="destructive"
                    onClick={() => revokeSessionKey(selectedKey.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Revoke Key
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}