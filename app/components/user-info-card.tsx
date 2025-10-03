import { useState } from "react";
import { ExternalLink, Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAddress } from "@/lib/utils";
import { useUser, useSmartAccountClient, useAuthModal } from "@account-kit/react";

export default function UserInfo() {
  const [isCopied, setIsCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const user = useUser();
  const userEmail = user?.email ?? (user?.address ? formatAddress(user.address) : "anon");
  const { client } = useSmartAccountClient({});
  const { openAuthModal } = useAuthModal();
  
  const walletAddress = client?.account?.address;
  console.log("Wallet address:", walletAddress);
  console.log("User object:", user);
  
  // For EOA connections, show the connected address
  const userDisplayName = user?.email || (user?.address ? formatAddress(user.address) : "anon");

  const handleCopy = () => {
    navigator.clipboard.writeText(client?.account?.address ?? "");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const deployWallet = async () => {
    if (!client) return;
    setIsDeploying(true);
    try {
      // Send a minimal transaction to deploy the wallet
      const hash = await client.sendUserOperation({
        uo: {
          target: client.account.address,
          data: "0x",
          value: BigInt(0),
        },
      });
      console.log("Wallet deployed:", hash);
    } catch (error) {
      console.error("Failed to deploy wallet:", error);
    }
    setIsDeploying(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          Your users are always in control of their non-custodial smart wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            User ID
          </p>
          <p className="font-medium">{userDisplayName}</p>
        </div>
        
        {/* Show connection type info */}
        {user && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Login Method
            </p>
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="text-xs w-fit">
                {user.type === 'eoa' ? 'MetaMask (EOA)' : user.type || "Smart Account"}
              </Badge>
              {user.type === 'eoa' && (
                <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-700 dark:text-amber-300">
                    <strong>Your MetaMask:</strong> {formatAddress(user.address)}
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 mt-1">
                    This acts as owner of your Smart Wallet below ↓
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-muted-foreground">
              Smart wallet address
            </p>
          </div>
          {!walletAddress ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  <strong>Smart Wallet Status:</strong> Not deployed yet
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Your MetaMask acts as the owner. Deploy your Smart Wallet to unlock features like gas sponsorship and batch transactions.
                </p>
              </div>
              <Button
                onClick={deployWallet}
                disabled={isDeploying}
                size="sm"
                className="w-full"
              >
                {isDeploying ? (
                  <>
                    <Wallet className="mr-2 h-4 w-4 animate-spin" />
                    Deploying Smart Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Deploy Smart Wallet
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs py-1 px-2">
                {formatAddress(walletAddress)}
              </Badge>
            <TooltipProvider>
              <Tooltip open={isCopied}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copied!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                const address = client?.account?.address;
                if (address && client?.chain?.blockExplorers?.default?.url) {
                  window.open(
                    `${client.chain.blockExplorers.default.url}/address/${address}`,
                    "_blank"
                  );
                }
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
