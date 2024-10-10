import { cookieStorage, createStorage, http, createConfig } from "wagmi";
import { optimism, base, optimismSepolia, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

// Ensure the WalletConnect project ID is defined
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error("Project ID is not defined");

// Metadata for the application
const metadata = {
  name: "Web3Modal Example",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Export the configuration with only the 4 chains included
export const config = createConfig({
  chains: [base, optimism, baseSepolia, optimismSepolia],
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: [
    coinbaseWallet({ appName: "Create Wagmi", preference: "smartWalletOnly" }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
