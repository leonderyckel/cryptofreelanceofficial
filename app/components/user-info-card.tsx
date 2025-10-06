import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/lib/hooks/use-toast";

export default function UserInfo() {
  const [isCopied, setIsCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const user = useUser();
  const userEmail = user?.email ?? (user?.address ? formatAddress(user.address) : "anon");
  const { client } = useSmartAccountClient({});
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  
  const walletAddress = client?.account?.address;
  console.log("Wallet address:", walletAddress);
  console.log("User object:", user);
  console.log("Client ready:", !!client);
  
  // For EOA connections, show the connected address
  const userDisplayName = user?.email || (user?.address ? formatAddress(user.address) : "anon");

  // Check if wallet is already deployed
  const checkWalletDeployment = useCallback(async () => {
    if (!client?.account?.address) return false;
    
    try {
      // Check if contract code exists at the address
      const code = await client.getBytecode({ address: client.account.address });
      return code && code !== '0x';
    } catch (error) {
      console.error("Error checking wallet deployment:", error);
      return false;
    }
  }, [client]);

  const deployWalletWithRetry = useCallback(async (isManual = false) => {
    if (!client || isDeploying) return;
    
    setIsDeploying(true);
    setDeploymentError(null);
    
    try {
      console.log(isManual ? "Manual deployment started..." : "Auto-deployment started...");
      
      // First check if already deployed
      const isDeployed = await checkWalletDeployment();
      if (isDeployed) {
        console.log("Wallet already deployed");
        setIsDeploying(false);
        return;
      }
      
      // Try deployment with a simple self-transaction
      const userOp = {
        target: client.account.address,
        data: "0x" as `0x${string}`,
        value: BigInt(0),
      };
      
      console.log("Sending deployment transaction...");
      const hash = await client.sendUserOperation({ uo: userOp });
      console.log("Deployment transaction sent:", hash);
      
      // Wait for confirmation
      const receipt = await client.waitForUserOperationTransaction(hash);
      console.log("Deployment confirmed:", receipt);
      
      // Verify deployment
      const deployedCheck = await checkWalletDeployment();
      if (deployedCheck) {
        console.log("Smart Wallet successfully deployed!");
        setRetryCount(0);
        toast({
          title: "✅ Smart Wallet Deployed!",
          description: "Your Smart Wallet is now ready for gas sponsorship and batch transactions.",
          variant: "success",
        });
      } else {
        throw new Error("Deployment transaction completed but wallet not deployed");
      }
      
    } catch (error: any) {
      console.error("Deployment failed:", error);
      const errorMessage = error.message || "Deployment failed";
      setDeploymentError(errorMessage);
      
      // Auto-retry up to 3 times for non-manual deployments
      if (!isManual && retryCount < 3) {
        console.log(`Retrying deployment (attempt ${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        toast({
          title: "⚠️ Auto-deployment Failed",
          description: `Retrying automatically... (${retryCount + 1}/3)`,
          variant: "warning",
        });
        setTimeout(() => deployWalletWithRetry(false), 2000);
        return;
      } else if (isManual) {
        toast({
          title: "❌ Deployment Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsDeploying(false);
    }
  }, [client, isDeploying, checkWalletDeployment, retryCount, toast]);

  // Auto-deploy Smart Wallet for EOA users
  useEffect(() => {
    const autoDeployWallet = async () => {
      // Only auto-deploy for EOA users with client ready and no wallet address
      if (user?.type === 'eoa' && client && !walletAddress && !isDeploying && !deploymentError) {
        console.log("Starting auto-deployment for EOA user...");
        // Add small delay to ensure client is fully ready
        setTimeout(() => deployWalletWithRetry(false), 1000);
      }
    };

    autoDeployWallet();
  }, [user?.type, client, walletAddress, isDeploying, deploymentError, deployWalletWithRetry]);

  const handleCopy = () => {
    const address = client?.account?.address ?? "";
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "📋 Address Copied!",
      description: `Copied ${formatAddress(address)} to clipboard`,
      variant: "success",
    });
  };

  const handleManualDeploy = () => {
    setRetryCount(0);
    deployWalletWithRetry(true);
  };

  return (
    <Card className="card-modern animate-slide-up">
      <CardHeader>
        <CardTitle className="gradient-text">User Profile</CardTitle>
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
              <Badge variant="secondary" className="text-xs w-fit status-badge animate-fade-in">
                {user.type === 'eoa' ? 'MetaMask (EOA)' : user.type || "Smart Account"}
              </Badge>
              {user.type === 'eoa' && (
                <div className="text-xs glass-effect p-3 rounded-lg border border-amber-200 dark:border-amber-800 animate-fade-in">
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
              <div className={`p-4 glass-effect rounded-xl border animate-fade-in ${
                deploymentError 
                  ? "border-red-200 dark:border-red-800"
                  : "border-blue-200 dark:border-blue-800"
              }`}>
                <p className={`text-sm mb-2 ${
                  deploymentError 
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}>
                  <strong>Smart Wallet Status:</strong> {
                    isDeploying 
                      ? `Deploying... ${retryCount > 0 ? `(Retry ${retryCount}/3)` : ''}`
                      : deploymentError 
                        ? "Deployment Failed"
                        : "Not deployed yet"
                  }
                </p>
                <p className={`text-xs ${
                  deploymentError 
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}>
                  {isDeploying 
                    ? "Deploying your Smart Wallet. This will enable gas sponsorship and batch transactions."
                    : deploymentError
                      ? `Error: ${deploymentError}`
                      : "Your MetaMask acts as the owner. Deploy your Smart Wallet to unlock features like gas sponsorship and batch transactions."
                  }
                </p>
              </div>
              {!isDeploying && (
                <div className="space-y-2">
                  <Button
                    onClick={handleManualDeploy}
                    disabled={isDeploying}
                    size="sm"
                    className="w-full button-gradient hover-lift"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {deploymentError ? "Retry Deployment" : "Deploy Smart Wallet Manually"}
                  </Button>
                  {deploymentError && (
                    <Button
                      onClick={() => {
                        setDeploymentError(null);
                        setRetryCount(0);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Clear Error
                    </Button>
                  )}
                </div>
              )}
              {isDeploying && (
                <div className="flex items-center justify-center py-2">
                  <Wallet className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {retryCount > 0 ? `Retrying deployment (${retryCount}/3)...` : "Deploying Smart Wallet..."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs py-1 px-2 status-badge success animate-fade-in">
                {formatAddress(walletAddress)}
              </Badge>
            <TooltipProvider>
              <Tooltip open={isCopied}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover-lift"
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
              className="h-6 w-6 hover-lift"
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
