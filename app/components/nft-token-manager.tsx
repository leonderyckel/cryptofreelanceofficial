"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image as ImageIcon,
  Coins,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Plus,
  Download,
  Upload,
  Palette,
  Gift,
  MoreVertical,
  Wallet,
  TrendingUp,
  Eye,
  Heart,
  Share,
} from "lucide-react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { formatAddress } from "@/lib/utils";
import { parseEther, parseUnits, formatEther } from "viem";

interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  metadata: any;
  collection: string;
  rarity?: string;
  lastSale?: string;
  floorPrice?: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price?: number;
  change24h?: number;
  logo?: string;
}

export default function NFTTokenManager() {
  const { client } = useSmartAccountClient({});
  const user = useUser();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  
  // Transfer states
  const [transferForm, setTransferForm] = useState({
    type: "token", // "token" or "nft"
    to: "",
    amount: "",
    tokenAddress: "",
    tokenId: "",
  });
  
  // Mint states
  const [mintForm, setMintForm] = useState({
    to: "",
    tokenURI: "",
    contractAddress: "",
    amount: "1",
  });

  // Swap states
  const [swapForm, setSwapForm] = useState({
    fromToken: "",
    toToken: "",
    amount: "",
    slippage: "1",
  });

  // Mock data for demo
  const mockNFTs: NFT[] = [
    {
      tokenId: "1",
      contractAddress: "0x1234567890123456789012345678901234567890",
      name: "Awesome NFT #1",
      description: "A unique digital collectible",
      image: "/api/placeholder/200/200",
      metadata: {},
      collection: "Awesome Collection",
      rarity: "Rare",
      lastSale: "0.5 ETH",
      floorPrice: "0.3 ETH",
    },
    {
      tokenId: "2",
      contractAddress: "0x1234567890123456789012345678901234567890",
      name: "Cool NFT #2",
      description: "Another unique digital art piece",
      image: "/api/placeholder/200/200",
      metadata: {},
      collection: "Cool Collection",
      rarity: "Common",
      lastSale: "0.2 ETH",
      floorPrice: "0.1 ETH",
    },
  ];

  const mockTokens: Token[] = [
    {
      address: "0xa0b86a33e6441e32181a85517c0c5e0de5437cb7",
      symbol: "USDC",
      name: "USD Coin",
      balance: "1000.50",
      decimals: 6,
      price: 1.00,
      change24h: 0.1,
      logo: "/icons/usdc.png",
    },
    {
      address: "0xfde91708ec37c02bff0b9a0b7d1b5b3e5c5d8c54",
      symbol: "USDT",
      name: "Tether USD",
      balance: "500.25",
      decimals: 6,
      price: 1.00,
      change24h: -0.05,
      logo: "/icons/usdt.png",
    },
  ];

  const loadNFTs = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call Alchemy NFT API
      // const response = await alchemy.nft.getNftsForOwner(client.account.address);
      setNfts(mockNFTs);
    } catch (error) {
      console.error("Failed to load NFTs:", error);
    }
    setIsLoading(false);
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      // In a real app, this would call Alchemy Token API
      // const response = await alchemy.core.getTokensForOwner(client.account.address);
      setTokens(mockTokens);
    } catch (error) {
      console.error("Failed to load tokens:", error);
    }
  }, []);

  // Load NFTs and tokens
  useEffect(() => {
    if (client?.account?.address) {
      loadNFTs();
      loadTokens();
    }
  }, [client?.account?.address, loadNFTs, loadTokens]);

  // Transfer token
  const transferToken = async () => {
    if (!client || !transferForm.to || !transferForm.amount) return;
    
    setIsLoading(true);
    try {
      const token = tokens.find(t => t.address === transferForm.tokenAddress);
      if (!token) return;

      const amount = parseUnits(transferForm.amount, token.decimals);
      
      // ERC-20 transfer
      const transferData = `0xa9059cbb${transferForm.to.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`;
      
      const hash = await client.sendUserOperation({
        uo: {
          target: transferForm.tokenAddress as `0x${string}`,
          data: transferData as `0x${string}`,
          value: BigInt(0),
        },
      });

      console.log("Token transfer sent:", hash);
      setTransferForm({ type: "token", to: "", amount: "", tokenAddress: "", tokenId: "" });
      
    } catch (error) {
      console.error("Failed to transfer token:", error);
    }
    setIsLoading(false);
  };

  // Transfer NFT
  const transferNFT = async () => {
    if (!client || !transferForm.to || !transferForm.tokenId) return;
    
    setIsLoading(true);
    try {
      // ERC-721 safeTransferFrom
      const fromAddress = client.account.address.slice(2).padStart(64, '0');
      const toAddress = transferForm.to.slice(2).padStart(64, '0');
      const tokenIdHex = parseInt(transferForm.tokenId).toString(16).padStart(64, '0');
      const transferData = `0x42842e0e${fromAddress}${toAddress}${tokenIdHex}`;
      
      const hash = await client.sendUserOperation({
        uo: {
          target: selectedNFT?.contractAddress as `0x${string}`,
          data: transferData as `0x${string}`,
          value: BigInt(0),
        },
      });

      console.log("NFT transfer sent:", hash);
      setTransferForm({ type: "nft", to: "", amount: "", tokenAddress: "", tokenId: "" });
      
    } catch (error) {
      console.error("Failed to transfer NFT:", error);
    }
    setIsLoading(false);
  };

  // Mint NFT
  const mintNFT = async () => {
    if (!client || !mintForm.to || !mintForm.tokenURI) return;
    
    setIsLoading(true);
    try {
      // This would typically interact with your NFT contract's mint function
      const mintData = `0x40c10f19${mintForm.to.slice(2).padStart(64, '0')}`; // mint(address to, uint256 tokenId)
      
      const hash = await client.sendUserOperation({
        uo: {
          target: mintForm.contractAddress as `0x${string}`,
          data: mintData as `0x${string}`,
          value: BigInt(0),
        },
      });

      console.log("NFT mint sent:", hash);
      setMintForm({ to: "", tokenURI: "", contractAddress: "", amount: "1" });
      
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    }
    setIsLoading(false);
  };

  // Swap tokens
  const swapTokens = async () => {
    if (!client || !swapForm.fromToken || !swapForm.toToken || !swapForm.amount) return;
    
    setIsLoading(true);
    try {
      // This would integrate with a DEX like Uniswap
      console.log("Swapping tokens...", swapForm);
      // Implementation would go here
      
    } catch (error) {
      console.error("Failed to swap tokens:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            NFT & Token Manager
          </CardTitle>
          <CardDescription>
            Manage your digital assets, transfer tokens, and trade NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <ImageIcon className="h-3 w-3 mr-1" />
                NFTs
              </Badge>
              <p className="text-xs text-muted-foreground">
                {nfts.length} collectibles
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Coins className="h-3 w-3 mr-1" />
                Tokens
              </Badge>
              <p className="text-xs text-muted-foreground">
                {tokens.length} different tokens
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <TrendingUp className="h-3 w-3 mr-1" />
                Portfolio
              </Badge>
              <p className="text-xs text-muted-foreground">
                ${tokens.reduce((sum, token) => sum + (parseFloat(token.balance) * (token.price || 0)), 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2 w-full">
                <Gift className="h-3 w-3 mr-1" />
                Actions
              </Badge>
              <p className="text-xs text-muted-foreground">
                Transfer, Mint, Swap
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="nfts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
        </TabsList>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your NFT Collection</CardTitle>
              <CardDescription>
                View and manage your digital collectibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : nfts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No NFTs found. Start your collection by minting or purchasing NFTs.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nfts.map((nft) => (
                    <Card key={`${nft.contractAddress}-${nft.tokenId}`} className="overflow-hidden">
                      <div className="aspect-square bg-muted relative">
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="bg-white/80 backdrop-blur">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setSelectedNFT(nft)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Transfer
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{nft.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{nft.collection}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {nft.rarity}
                          </Badge>
                          <span className="text-sm font-medium">{nft.floorPrice}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Portfolio</CardTitle>
              <CardDescription>
                Your ERC-20 token holdings and balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokens.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tokens found. Add tokens to your wallet to see them here.
                </p>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div key={token.address} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          {token.logo ? (
                            <Image src={token.logo} alt={token.symbol} width={24} height={24} />
                          ) : (
                            <Coins className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-sm text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{parseFloat(token.balance).toFixed(2)} {token.symbol}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-muted-foreground">
                            ${(parseFloat(token.balance) * (token.price || 0)).toFixed(2)}
                          </p>
                          {token.change24h && (
                            <Badge variant={token.change24h >= 0 ? "default" : "destructive"} className="text-xs">
                              {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Assets</CardTitle>
              <CardDescription>
                Send tokens or NFTs to other addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select
                  value={transferForm.type}
                  onValueChange={(value) => setTransferForm({...transferForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="token">Token</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Address</Label>
                <Input
                  placeholder="0x..."
                  value={transferForm.to}
                  onChange={(e) => setTransferForm({...transferForm, to: e.target.value})}
                />
              </div>

              {transferForm.type === "token" ? (
                <>
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select
                      value={transferForm.tokenAddress}
                      onValueChange={(value) => setTransferForm({...transferForm, tokenAddress: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.address} value={token.address}>
                            {token.symbol} - {token.balance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      placeholder="0.0"
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>NFT</Label>
                    <Select
                      value={transferForm.tokenId}
                      onValueChange={(value) => setTransferForm({...transferForm, tokenId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select NFT" />
                      </SelectTrigger>
                      <SelectContent>
                        {nfts.map((nft) => (
                          <SelectItem key={`${nft.contractAddress}-${nft.tokenId}`} value={nft.tokenId}>
                            {nft.name} (#{nft.tokenId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={transferForm.type === "token" ? transferToken : transferNFT}
                disabled={isLoading || !transferForm.to || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Transfer {transferForm.type === "token" ? "Token" : "NFT"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mint Tab */}
        <TabsContent value="mint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mint NFT</CardTitle>
              <CardDescription>
                Create new NFTs on your contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contract Address</Label>
                <Input
                  placeholder="0x..."
                  value={mintForm.contractAddress}
                  onChange={(e) => setMintForm({...mintForm, contractAddress: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="0x..."
                  value={mintForm.to}
                  onChange={(e) => setMintForm({...mintForm, to: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Token URI (Metadata)</Label>
                <Input
                  placeholder="https://..."
                  value={mintForm.tokenURI}
                  onChange={(e) => setMintForm({...mintForm, tokenURI: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  placeholder="1"
                  type="number"
                  value={mintForm.amount}
                  onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
                />
              </div>

              <Button
                onClick={mintNFT}
                disabled={isLoading || !mintForm.to || !mintForm.contractAddress || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Mint NFT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Swap Tab */}
        <TabsContent value="swap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>
                Exchange tokens using decentralized exchanges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>From Token</Label>
                <Select
                  value={swapForm.fromToken}
                  onValueChange={(value) => setSwapForm({...swapForm, fromToken: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select token to swap from" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.address} value={token.address}>
                        {token.symbol} - {token.balance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Token</Label>
                <Select
                  value={swapForm.toToken}
                  onValueChange={(value) => setSwapForm({...swapForm, toToken: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select token to swap to" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.address} value={token.address}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  placeholder="0.0"
                  type="number"
                  value={swapForm.amount}
                  onChange={(e) => setSwapForm({...swapForm, amount: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Slippage Tolerance (%)</Label>
                <Input
                  placeholder="1"
                  type="number"
                  value={swapForm.slippage}
                  onChange={(e) => setSwapForm({...swapForm, slippage: e.target.value})}
                />
              </div>

              <Button
                onClick={swapTokens}
                disabled={isLoading || !swapForm.fromToken || !swapForm.toToken || !swapForm.amount || !client}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Swap Tokens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NFT Details Modal */}
      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedNFT.name}</DialogTitle>
              <DialogDescription>{selectedNFT.collection}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                <Image
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Token ID</Label>
                  <p className="font-mono text-sm">{selectedNFT.tokenId}</p>
                </div>
                <div>
                  <Label className="text-xs">Rarity</Label>
                  <p className="text-sm">{selectedNFT.rarity}</p>
                </div>
                <div>
                  <Label className="text-xs">Last Sale</Label>
                  <p className="text-sm">{selectedNFT.lastSale}</p>
                </div>
                <div>
                  <Label className="text-xs">Floor Price</Label>
                  <p className="text-sm">{selectedNFT.floorPrice}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  OpenSea
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}