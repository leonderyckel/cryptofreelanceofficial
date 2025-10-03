"use client";

import { useSignerStatus, useUser } from "@account-kit/react";
import UserInfoCard from "./components/user-info-card";
import NftMintCard from "./components/nft-mint-card";
import LoginCard from "./components/login-card";
import Header from "./components/header";
import LearnMore from "./components/learn-more";
import DebugConnection from "./components/debug-connection";

export default function Home() {
  const signerStatus = useSignerStatus();
  const user = useUser();
  
  console.log("Signer Status:", signerStatus);
  console.log("User:", user);
  
  // Check if user is connected via either smart account OR EOA
  const isConnected = signerStatus.isConnected || !!user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <div className="bg-bg-main bg-cover bg-center bg-no-repeat h-[calc(100vh-4rem)]">
        <main className="container mx-auto px-4 py-8 h-full">
          {isConnected ? (
            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-8">
                <UserInfoCard />
                <LearnMore />
              </div>
              <NftMintCard />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full pb-[4rem]">
              <div className="flex flex-col gap-4 items-center">
                <LoginCard />
                <DebugConnection />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
