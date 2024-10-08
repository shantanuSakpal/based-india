import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";
import { Chain } from "wagmi/chains";

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

// Base Mainnet configuration
const baseMainnet: Chain = {
    id: 8453,
    name: "Base Mainnet",
    nativeCurrency: {
        decimals: 18,
        name: "Base",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["https://base-rpc.publicnode.com"] },
    },
    blockExplorers: {
        default: { name: "Base Explorer", url: "https://basescan.org" },
    },
};

// Base Sepolia configuration
const baseSepoliaTestnet: Chain = {
    id: 84532,
    name: "Base Sepolia",
    nativeCurrency: {
        decimals: 18,
        name: "Sepolia Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["https://base-sepolia-rpc.publicnode.com"] },
    },
    blockExplorers: {
        default: { name: "Base Sepolia Explorer", url: "https://sepolia.basescan.org" },
    },
};

// Optimism Mainnet configuration
const optimismMainnet: Chain = {
    id: 10,
    name: "Optimism",
    nativeCurrency: {
        decimals: 18,
        name: "Optimism Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["https://optimism-rpc.publicnode.com"] },
    },
    blockExplorers: {
        default: { name: "Optimism Explorer", url: "https://optimistic.etherscan.io" },
    },
};

// Optimism Sepolia configuration
const optimismSepoliaTestnet: Chain = {
    id: 11155420,
    name: "Optimism Sepolia",
    nativeCurrency: {
        decimals: 18,
        name: "Sepolia Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["https://sepolia.optimism.io"] },
    },
    blockExplorers: {
        default: { name: "Optimism Sepolia Explorer", url: "https://sepolia-optimism.etherscan.io" },
    },
};

// Export the configuration with only the 4 chains included
export const config = defaultWagmiConfig({
    chains: [
        baseMainnet,
        baseSepoliaTestnet,
        optimismMainnet,
        optimismSepoliaTestnet
    ], 
    projectId,
    metadata,
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
});
