"use client";

import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button, ButtonGroup } from "@nextui-org/button";
import WalletWrapper from "./WalletWrapper";

export default function WalletConnectButton({text, className}: {text: string, className: string}) {
  return (
    <WalletWrapper
      className= {className || "min-w-[90px] bg-blue-500 hover:bg-blue-600"}
      text={text || "Connect Wallet"}
      withWalletAggregator={true}
    />
  );
}
