import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
  configForExternalWallets,
} from "@account-kit/react";
import { alchemy, arbitrumSepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
console.log("API_KEY:", API_KEY ? "Set" : "Not set");
if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_API_KEY is not set");
}

const SPONSORSHIP_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID;
console.log("POLICY_ID:", SPONSORSHIP_POLICY_ID ? "Set" : "Not set");
if (!SPONSORSHIP_POLICY_ID) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_POLICY_ID is not set");
}

// Configuration for external wallets (MetaMask, Coinbase Wallet, etc.)
const externalWalletsConfig = configForExternalWallets({
  wallets: ["metamask", "coinbase wallet", "wallet_connect"],
  chainType: ["evm"],
  walletConnectProjectId: "2f5a2c5c8c1d4b5e3f6a7c8d9e0f1a2b", // Replace with your actual WalletConnect project ID
  hideMoreButton: false,
  numFeaturedWallets: 3,
});

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
      ],
      [
        { type: "passkey" },
        { 
          type: "external_wallets",
          walletConnect: {
            projectId: "2f5a2c5c8c1d4b5e3f6a7c8d9e0f1a2b"
          }
        },
      ],
    ],
    addPasskeyOnSignup: true,
  },
  supportUrl: "https://alchemy.com/support",
};

export const config = createConfig(
  {
    transport: alchemy({ apiKey: API_KEY }),
    // Note: This quickstart is configured for Arbitrum Sepolia.
    chain: arbitrumSepolia,
    ssr: true, // more about ssr: https://www.alchemy.com/docs/wallets/react/ssr
    storage: cookieStorage, // more about persisting state with cookies: https://www.alchemy.com/docs/wallets/react/ssr#persisting-the-account-state
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    policyId: SPONSORSHIP_POLICY_ID,
  },
  uiConfig
);

export const queryClient = new QueryClient();
