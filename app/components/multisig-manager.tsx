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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Shield,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  UserPlus,
  Settings,
  Vote,
  FileText,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { formatAddress } from "@/lib/utils";
import { parseEther } from "viem";

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: "transfer" | "addOwner" | "removeOwner" | "changeThreshold" | "custom";
  target?: string;
  value?: string;
  data?: string;
  proposer: string;
  created: number;
  executed: boolean;
  cancelled: boolean;
  signatures: Signature[];
  requiredSignatures: number;
  deadline: number;
}

interface Signature {
  signer: string;
  signature: string;
  timestamp: number;
}

interface Owner {
  address: string;
  name?: string;
  isActive: boolean;
  addedAt: number;
}

interface MultisigConfig {
  owners: Owner[];
  threshold: number;
  isMultiOwner: boolean;
  proposalCount: number;
}

export default function MultisigManager() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<MultisigConfig>({
    owners: [],
    threshold: 1,
    isMultiOwner: false,
    proposalCount: 0,
  });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Forms
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    type: "transfer" as const,
    target: "",
    value: "",
    data: "0x",
  });
  
  const [newOwner, setNewOwner] = useState({
    address: "",
    name: "",
  });
  
  const [thresholdChange, setThresholdChange] = useState({
    newThreshold: 1,
  });

  // Mock data for demo
  const mockConfig: MultisigConfig = {
    owners: [
      {
        address: user?.address || "0x1234567890123456789012345678901234567890",
        name: "You",
        isActive: true,
        addedAt: Date.now() - 86400000,
      },
      {
        address: "0x2345678901234567890123456789012345678901",
        name: "Alice",
        isActive: true,
        addedAt: Date.now() - 86400000 * 2,
      },
      {
        address: "0x3456789012345678901234567890123456789012",
        name: "Bob",
        isActive: true,
        addedAt: Date.now() - 86400000 * 3,
      },
    ],
    threshold: 2,
    isMultiOwner: true,
    proposalCount: 3,
  };

  const mockProposals: Proposal[] = [
    {
      id: "1",
      title: "Transfer 1 ETH to Treasury",
      description: "Move funds to the treasury wallet for safekeeping",
      type: "transfer",
      target: "0x4567890123456789012345678901234567890123",
      value: "1",
      data: "0x",
      proposer: mockConfig.owners[0].address,
      created: Date.now() - 3600000,
      executed: false,
      cancelled: false,
      signatures: [
        {
          signer: mockConfig.owners[0].address,
          signature: "0xabcd...",
          timestamp: Date.now() - 3600000,
        },
      ],
      requiredSignatures: 2,
      deadline: Date.now() + 86400000 * 7,
    },
    {
      id: "2", 
      title: "Add New Owner: Charlie",
      description: "Add Charlie as a new owner to the multisig",
      type: "addOwner",
      target: "0x5678901234567890123456789012345678901234",
      proposer: mockConfig.owners[1].address,
      created: Date.now() - 7200000,
      executed: true,
      cancelled: false,
      signatures: [
        {
          signer: mockConfig.owners[0].address,
          signature: "0xabcd...",
          timestamp: Date.now() - 7200000,
        },
        {
          signer: mockConfig.owners[1].address,
          signature: "0xefgh...",
          timestamp: Date.now() - 3600000,
        },
      ],
      requiredSignatures: 2,
      deadline: Date.now() + 86400000 * 6,
    },
  ];

  // Load multisig configuration
  useEffect(() => {
    if (client?.account?.address) {
      loadMultisigConfig();
      loadProposals();
    }
  }, [client?.account?.address]);

  const loadMultisigConfig = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would query the multisig contract
      setConfig(mockConfig);
    } catch (error) {
      console.error("Failed to load multisig config:", error);
    }
    setIsLoading(false);
  };

  const loadProposals = async () => {
    try {
      // In a real app, this would query proposal events
      setProposals(mockProposals);
    } catch (error) {
      console.error("Failed to load proposals:", error);
    }
  };

  // Create new proposal
  const createProposal = async () => {
    if (!client || !newProposal.title || !newProposal.target) return;
    
    setIsLoading(true);
    try {
      let data = "0x";
      
      switch (newProposal.type) {
        case "transfer":
          // Simple transfer
          data = "0x";
          break;
        case "addOwner":
          // addOwner(address)
          data = `0x7065cb48${newProposal.target.slice(2).padStart(64, '0')}`;
          break;
        case "removeOwner":
          // removeOwner(address)
          data = `0x173825d9${newProposal.target.slice(2).padStart(64, '0')}`;
          break;
        case "changeThreshold":
          // changeThreshold(uint256)
          data = `0x694e80c3${parseInt(newProposal.value || "1").toString(16).padStart(64, '0')}`;
          break;
        default:
          data = newProposal.data;
      }

      const userOp = {
        target: newProposal.target as `0x${string}`,
        data: data as `0x${string}`,
        value: newProposal.value ? parseEther(newProposal.value) : BigInt(0),
      };

      console.log("Creating proposal:", userOp);
      
      // This would create a proposal in the multisig contract
      const hash = await client.sendUserOperation({ uo: userOp });
      
      console.log("Proposal created:", hash);
      setNewProposal({
        title: "",
        description: "",
        type: "transfer",
        target: "",
        value: "",
        data: "0x",
      });
      
      // Reload proposals
      await loadProposals();
      
    } catch (error) {
      console.error("Failed to create proposal:", error);
    }
    setIsLoading(false);
  };

  // Sign proposal
  const signProposal = async (proposalId: string) => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) return;

      // Create signature for the proposal
      console.log("Signing proposal:", proposalId);
      
      // This would call the multisig contract's confirmTransaction function
      // Implementation would go here
      
      // Update local state
      const updatedProposals = proposals.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            signatures: [
              ...p.signatures,
              {
                signer: user?.address || "",
                signature: "0x" + Math.random().toString(16),
                timestamp: Date.now(),
              }
            ]
          };
        }
        return p;
      });
      setProposals(updatedProposals);
      
    } catch (error) {
      console.error("Failed to sign proposal:", error);
    }
    setIsLoading(false);
  };

  // Execute proposal
  const executeProposal = async (proposalId: string) => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal || proposal.signatures.length < proposal.requiredSignatures) return;

      console.log("Executing proposal:", proposalId);
      
      // This would call the multisig contract's executeTransaction function
      // Implementation would go here
      
      // Update local state
      const updatedProposals = proposals.map(p => {
        if (p.id === proposalId) {
          return { ...p, executed: true };
        }
        return p;
      });
      setProposals(updatedProposals);
      
    } catch (error) {
      console.error("Failed to execute proposal:", error);
    }
    setIsLoading(false);
  };

  // Add owner
  const addOwner = async () => {
    if (!newOwner.address) return;
    
    await createProposal();
  };

  // Change threshold
  const changeThreshold = async () => {
    setNewProposal({
      title: `Change Threshold to ${thresholdChange.newThreshold}`,
      description: `Update the required number of signatures to ${thresholdChange.newThreshold}`,
      type: "changeThreshold",
      target: client?.account?.address || "",
      value: thresholdChange.newThreshold.toString(),
      data: "0x",
    });
  };

  const getProposalStatus = (proposal: Proposal) => {
    if (proposal.executed) return { status: "Executed", variant: "default" as const, icon: CheckCircle };
    if (proposal.cancelled) return { status: "Cancelled", variant: "destructive" as const, icon: XCircle };
    if (proposal.deadline < Date.now()) return { status: "Expired", variant: "destructive" as const, icon: Clock };
    if (proposal.signatures.length >= proposal.requiredSignatures) return { status: "Ready to Execute", variant: "default" as const, icon: Vote };
    return { status: `${proposal.signatures.length}/${proposal.requiredSignatures} Signed`, variant: "secondary" as const, icon: Clock };
  };

  const canUserSign = (proposal: Proposal) => {
    if (!user?.address) return false;
    const isOwner = config.owners.some(owner => owner.address === user.address);
    const alreadySigned = proposal.signatures.some(sig => sig.signer === user.address);
    return isOwner && !alreadySigned && !proposal.executed && !proposal.cancelled;
  };

  const canExecute = (proposal: Proposal) => {
    return proposal.signatures.length >= proposal.requiredSignatures && !proposal.executed && !proposal.cancelled;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multisig Wallet Manager
          </CardTitle>
          <CardDescription>
            Manage multi-signature wallet operations and governance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Users className="h-3 w-3 mr-1" />
                Owners
              </Badge>
              <p className="text-xs text-muted-foreground">
                {config.owners.filter(o => o.isActive).length} active
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Key className="h-3 w-3 mr-1" />
                Threshold
              </Badge>
              <p className="text-xs text-muted-foreground">
                {config.threshold} of {config.owners.length}
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Vote className="h-3 w-3 mr-1" />
                Proposals
              </Badge>
              <p className="text-xs text-muted-foreground">
                {proposals.filter(p => !p.executed && !p.cancelled).length} pending
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <CheckCircle className="h-3 w-3 mr-1" />
                Executed
              </Badge>
              <p className="text-xs text-muted-foreground">
                {proposals.filter(p => p.executed).length} completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Proposals</CardTitle>
              <CardDescription>
                View and vote on multisig proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proposals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No proposals found. Create your first proposal to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => {
                    const status = getProposalStatus(proposal);
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card key={proposal.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{proposal.title}</h3>
                              <Badge variant={status.variant} className="text-xs">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {proposal.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {proposal.description}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium">Proposer:</span> {formatAddress(proposal.proposer)}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {new Date(proposal.created).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Target:</span> {proposal.target ? formatAddress(proposal.target) : "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Value:</span> {proposal.value || "0"} ETH
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {canUserSign(proposal) && (
                              <Button
                                size="sm"
                                onClick={() => signProposal(proposal.id)}
                                disabled={isLoading}
                              >
                                <Vote className="h-4 w-4 mr-1" />
                                Sign
                              </Button>
                            )}
                            {canExecute(proposal) && (
                              <Button
                                size="sm"
                                onClick={() => executeProposal(proposal.id)}
                                disabled={isLoading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Execute
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProposal(proposal)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Signatures */}
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-xs font-medium">Signatures ({proposal.signatures.length}/{proposal.requiredSignatures})</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {proposal.signatures.map((sig, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {formatAddress(sig.signer)}
                              </Badge>
                            ))}
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

        {/* Owners Tab */}
        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Owners</CardTitle>
              <CardDescription>
                Manage multisig wallet owners and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.owners.map((owner) => (
                    <TableRow key={owner.address}>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(owner.address)}
                      </TableCell>
                      <TableCell>{owner.name || "Unnamed"}</TableCell>
                      <TableCell>
                        <Badge variant={owner.isActive ? "default" : "secondary"}>
                          {owner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(owner.addedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Address
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Name
                            </DropdownMenuItem>
                            {owner.address !== user?.address && (
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Owner
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
              <CardDescription>
                Submit a new proposal for multisig execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Proposal title"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newProposal.type}
                    onValueChange={(value: any) => setNewProposal({...newProposal, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer Funds</SelectItem>
                      <SelectItem value="addOwner">Add Owner</SelectItem>
                      <SelectItem value="removeOwner">Remove Owner</SelectItem>
                      <SelectItem value="changeThreshold">Change Threshold</SelectItem>
                      <SelectItem value="custom">Custom Transaction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what this proposal does"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Address</Label>
                  <Input
                    placeholder="0x..."
                    value={newProposal.target}
                    onChange={(e) => setNewProposal({...newProposal, target: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Value (ETH)</Label>
                  <Input
                    placeholder="0.0"
                    type="number"
                    step="0.001"
                    value={newProposal.value}
                    onChange={(e) => setNewProposal({...newProposal, value: e.target.value})}
                  />
                </div>
              </div>

              {newProposal.type === "custom" && (
                <div className="space-y-2">
                  <Label>Transaction Data</Label>
                  <Textarea
                    placeholder="0x..."
                    value={newProposal.data}
                    onChange={(e) => setNewProposal({...newProposal, data: e.target.value})}
                  />
                </div>
              )}

              <Button
                onClick={createProposal}
                disabled={isLoading || !newProposal.title || !newProposal.target || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multisig Settings</CardTitle>
              <CardDescription>
                Configure multisig parameters and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Owner */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Add New Owner</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="0x..."
                      value={newOwner.address}
                      onChange={(e) => setNewOwner({...newOwner, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (Optional)</Label>
                    <Input
                      placeholder="Owner name"
                      value={newOwner.name}
                      onChange={(e) => setNewOwner({...newOwner, name: e.target.value})}
                    />
                  </div>
                </div>
                <Button
                  onClick={addOwner}
                  disabled={!newOwner.address || !client}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Propose Adding Owner
                </Button>
              </div>

              {/* Change Threshold */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Change Signature Threshold</Label>
                <div className="space-y-2">
                  <Label>New Threshold</Label>
                  <Select
                    value={thresholdChange.newThreshold.toString()}
                    onValueChange={(value) => setThresholdChange({newThreshold: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: config.owners.length}, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} of {config.owners.length} signatures required
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={changeThreshold}
                  disabled={thresholdChange.newThreshold === config.threshold || !client}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Propose Threshold Change
                </Button>
              </div>

              {/* Current Settings */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Current Configuration</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total Owners</p>
                    <p className="text-2xl font-bold">{config.owners.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Required Signatures</p>
                    <p className="text-2xl font-bold">{config.threshold}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProposal.title}</DialogTitle>
              <DialogDescription>
                Proposal ID: {selectedProposal.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedProposal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm mt-1">{selectedProposal.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className="mt-1">
                    {getProposalStatus(selectedProposal).status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Target</Label>
                  <p className="text-sm mt-1 font-mono">{selectedProposal.target ? formatAddress(selectedProposal.target) : "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Value</Label>
                  <p className="text-sm mt-1">{selectedProposal.value || "0"} ETH</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Transaction Data</Label>
                <div className="bg-muted p-3 rounded-lg mt-1">
                  <code className="text-xs break-all">{selectedProposal.data || "0x"}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Signatures ({selectedProposal.signatures.length}/{selectedProposal.requiredSignatures})</Label>
                <div className="space-y-2 mt-2">
                  {selectedProposal.signatures.map((sig, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-mono text-xs">{formatAddress(sig.signer)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sig.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {canUserSign(selectedProposal) && (
                  <Button
                    onClick={() => signProposal(selectedProposal.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    Sign Proposal
                  </Button>
                )}
                {canExecute(selectedProposal) && (
                  <Button
                    onClick={() => executeProposal(selectedProposal.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Execute
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}