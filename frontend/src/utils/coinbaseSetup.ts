import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";

export const sdk = new CoinbaseWalletSDK({
  appName: "Decentrix ai",
  appChainIds: [8453],
});
