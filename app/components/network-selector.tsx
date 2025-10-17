"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Network, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Network {
  id: string;
  name: string;
  chainId: number;
  symbol: string;
  color: string;
  icon: string;
  isTestnet: boolean;
}

const SUPPORTED_NETWORKS: Network[] = [
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    symbol: "ETH",
    color: "bg-blue-500",
    icon: "🔵",
    isTestnet: true,
  },
  {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    chainId: 80002,
    symbol: "MATIC",
    color: "bg-purple-500",
    icon: "🟣",
    isTestnet: true,
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    symbol: "ETH",
    color: "bg-gray-500",
    icon: "⚪",
    isTestnet: true,
  }
];

interface NetworkSelectorProps {
  currentNetwork?: string;
  onNetworkChange: (networkId: string) => void;
  disabled?: boolean;
}

export default function NetworkSelector({ 
  currentNetwork = "arbitrum-sepolia", 
  onNetworkChange,
  disabled = false 
}: NetworkSelectorProps) {
  const selectedNetwork = SUPPORTED_NETWORKS.find(n => n.id === currentNetwork) || SUPPORTED_NETWORKS[0];

  return (
    <Card className="w-fit">
      <CardContent className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 min-w-[200px] justify-between"
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedNetwork.color}`} />
                <span className="text-lg">{selectedNetwork.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{selectedNetwork.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedNetwork.symbol} • {selectedNetwork.chainId}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4" />
                <span className="font-medium text-sm">Select Network</span>
              </div>
              {SUPPORTED_NETWORKS.map((network) => (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => onNetworkChange(network.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div className={`w-3 h-3 rounded-full ${network.color}`} />
                  <span className="text-lg">{network.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{network.name}</span>
                      {network.isTestnet && (
                        <Badge variant="secondary" className="text-xs">
                          Testnet
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {network.symbol} • Chain ID: {network.chainId}
                    </div>
                  </div>
                  {currentNetwork === network.id && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}