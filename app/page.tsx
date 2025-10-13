"use client";

import { useState } from "react";
import { useSignerStatus, useUser } from "@account-kit/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserInfoCard from "./components/user-info-card";
import NftMintCard from "./components/nft-mint-card";
import LoginCard from "./components/login-card";
import Header from "./components/header";
import LearnMore from "./components/learn-more";
import DebugConnection from "./components/debug-connection";
import TransactionManager from "./components/transaction-manager";
import NFTTokenManager from "./components/nft-token-manager";
import MultisigManager from "./components/multisig-manager";
import SessionKeysManager from "./components/session-keys-manager";
import TestTransactions from "./components/test-transactions";
import WalletBalance from "./components/wallet-balance";
import SimpleTransactionTest from "./components/simple-transaction-test";
import TransactionDebugger from "./components/transaction-debugger";
import NoSponsorshipTest from "./components/no-sponsorship-test";
import WalletDeploymentTest from "./components/wallet-deployment-test";

export default function Home() {
  const signerStatus = useSignerStatus();
  const user = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  
  console.log("Signer Status:", signerStatus);
  console.log("User:", user);
  
  // Check if user is connected via either smart account OR EOA
  const isConnected = signerStatus.isConnected || !!user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <div className="bg-bg-main bg-cover bg-center bg-no-repeat min-h-[calc(100vh-4rem)]">
        <main className="container mx-auto px-4 py-8">
          {isConnected ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="glass-effect grid w-full grid-cols-7 mb-8 p-2 rounded-xl border-0 shadow-lg">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="multisig">Multisig</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="mint">Mint NFT</TabsTrigger>
                <TabsTrigger value="test">🧪 Test</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                  <div className="flex flex-col gap-8">
                    <UserInfoCard />
                    <WalletBalance />
                    <LearnMore />
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 card-modern">
                        <h3 className="font-semibold mb-2 gradient-text">⚡ Quick Actions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Access commonly used features
                        </p>
                        <div className="space-y-2">
                          <button 
                            onClick={() => setActiveTab("transactions")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            💸 Send Transactions
                          </button>
                          <button 
                            onClick={() => setActiveTab("assets")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            🎨 Manage NFTs & Tokens
                          </button>
                          <button 
                            onClick={() => setActiveTab("automation")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            🔐 Session Keys
                          </button>
                        </div>
                      </div>
                      <div className="p-6 card-modern">
                        <h3 className="font-semibold mb-2 gradient-text">🚀 Advanced Features</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Explore powerful wallet capabilities
                        </p>
                        <div className="space-y-2">
                          <button 
                            onClick={() => setActiveTab("multisig")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            🛡️ Multisig Governance
                          </button>
                          <button 
                            onClick={() => setActiveTab("transactions")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            ⚡ Batch Transactions
                          </button>
                          <button 
                            onClick={() => setActiveTab("transactions")}
                            className="w-full text-left p-3 hover:bg-gradient-to-r 
                                       hover:from-primary/10 hover:to-secondary/10 rounded-lg 
                                       text-sm hover-lift transition-all duration-200"
                          >
                            💨 Gas Sponsorship
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="animate-slide-up">
                <TransactionManager />
              </TabsContent>

              <TabsContent value="assets" className="animate-slide-up">
                <NFTTokenManager />
              </TabsContent>

              <TabsContent value="multisig" className="animate-slide-up">
                <MultisigManager />
              </TabsContent>

              <TabsContent value="automation" className="animate-slide-up">
                <SessionKeysManager />
              </TabsContent>

              <TabsContent value="mint" className="animate-slide-up">
                <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                  <div className="flex flex-col gap-8">
                    <UserInfoCard />
                  </div>
                  <NftMintCard />
                </div>
              </TabsContent>

              <TabsContent value="test" className="animate-slide-up">
                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                    <WalletDeploymentTest />
                    <TransactionDebugger />
                  </div>
                  <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                    <SimpleTransactionTest />
                    <NoSponsorshipTest />
                  </div>
                  <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                    <TestTransactions />
                    <div className="flex flex-col gap-8">
                      <UserInfoCard />
                      <WalletBalance />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
              <div className="flex flex-col gap-6 items-center animate-slide-up">
                <div className="glass-effect p-8 rounded-2xl border shadow-2xl hover-lift max-w-md w-full">
                  <LoginCard />
                  <DebugConnection />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
