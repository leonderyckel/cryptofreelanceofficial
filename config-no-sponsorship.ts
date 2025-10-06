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

// External wallets configuration exactly as per Alchemy documentation
export const externalWalletsConfig = configForExternalWallets({
  wallets: ["wallet_connect", "metamask", "coinbase wallet"],
  chainType: ["evm"],
  walletConnectProjectId: "2f5a2c5c8c1d4b5e3f6a7c8d9e0f1a2b",
  hideMoreButton: false,
  numFeaturedWallets: 3,
});

// Configuration without gas sponsorship for testing
export const configNoSponsorship = createConfig(
  {
    transport: alchemy({ apiKey: API_KEY }),
    chain: arbitrumSepolia,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    sessionConfig: {
      expirationTimeMs: 1000 * 60 * 60 * 24, // 24 hours for better UX
    },
    // No policyId = no gas sponsorship
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