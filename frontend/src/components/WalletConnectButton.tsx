"use client";

import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button, ButtonGroup } from "@nextui-org/button";
import WalletWrapper from "./WalletWrapper";

export default function WalletConnectButton() {
  return (
    <WalletWrapper
      className="min-w-[90px] bg-blue-500 hover:bg-blue-600"
      text="Connect Wallet"
      withWalletAggregator={true}
    />
  );
}
