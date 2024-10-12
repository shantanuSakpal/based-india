"use client";

import React, { ReactNode } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";
import { wagmiConfig, projectId } from "./wagmiConfig";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base, baseSepolia, optimismSepolia } from "viem/chains";
import { NEXT_PUBLIC_CDP_API_KEY } from "@/utils/config";

if (!projectId) throw new Error("Project ID is not defined");

createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: true, // Optional
});

export const WagmiProviderComp = ({ children, initialState }) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // configure as per your needs
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={NEXT_PUBLIC_CDP_API_KEY}
          chain={baseSepolia}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default WagmiProviderComp;
