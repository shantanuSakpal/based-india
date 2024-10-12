import { cookieStorage, createStorage, http, createConfig } from "wagmi";
import { optimism, base, optimismSepolia, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

// Ensure the WalletConnect project ID is defined
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
if (!projectId) throw new Error("Project ID is not defined");

// Metadata for the application
const metadata = {
  name: "Web3Modal Example",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const wagmiConfig = createConfig({
  chains: [base, optimism, baseSepolia, optimismSepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: [
    coinbaseWallet({ appName: "Decentrix.AI", preference: "smartWalletOnly" }),
  ],
  transport: {
    [baseSepolia.id]: http(),
  },
});
