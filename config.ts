import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
  configForExternalWallets,
} from "@account-kit/react";
import { alchemy, arbitrumSepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { Connection } from "@solana/web3.js";

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

// External wallets configuration exactly as per Alchemy documentation
export const externalWalletsConfig = configForExternalWallets({
  wallets: ["wallet_connect", "metamask", "coinbase wallet"],
  chainType: ["evm"],
  walletConnectProjectId: "2f5a2c5c8c1d4b5e3f6a7c8d9e0f1a2b",
  hideMoreButton: false,
  numFeaturedWallets: 3,
});

export const config = createConfig(
  {
    transport: alchemy({ apiKey: API_KEY }),
    chain: arbitrumSepolia,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    sessionConfig: {
      expirationTimeMs: 1000 * 60 * 60 * 24, // 24 hours for better UX
    },
    policyId: SPONSORSHIP_POLICY_ID,
    connectors: externalWalletsConfig.connectors,
    // Enhanced EOA support
    smartAccountConfig: {
      gasManagerConfig: {
        policyId: SPONSORSHIP_POLICY_ID,
      },
    },
  },
  {
    illustrationStyle: "outline",
    auth: {
      sections: [
        // Primary authentication methods
        [{ type: "email" }],
        [
          { type: "passkey" },
          { type: "social", authProviderId: "google", mode: "popup" },
          { type: "social", authProviderId: "facebook", mode: "popup" },
        ],
        [{ type: "external_wallets", ...externalWalletsConfig.uiConfig }],
      ],
      addPasskeyOnSignup: true,
    },
    supportUrl: "https://alchemy.com/support",
  }
);

export const queryClient = new QueryClient();
