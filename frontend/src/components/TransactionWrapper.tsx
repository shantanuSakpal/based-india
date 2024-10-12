import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import type {
  TransactionError,
  TransactionResponse,
} from "@coinbase/onchainkit/transaction";
import type { Address, ContractFunctionParameters } from "viem";

interface TransactionWrapperProps {
  address: Address | null;
  abi: any;
  bytecode: string;
  chainId: number;
  onSuccess: (response: TransactionResponse) => void;
  onError: (error: TransactionError) => void;
}

export default function TransactionWrapper({
  address,
  abi,
  bytecode,
  chainId,
  onSuccess,
  onError,
}: TransactionWrapperProps) {
  const contracts = [
    {
      abi,
      bytecode,
    },
  ] as unknown as ContractFunctionParameters[];

  return (
    <div className="flex w-[450px]">
      <Transaction
        contracts={contracts}
        className="w-[450px]"
        chainId={chainId}
        onError={onError}
        onSuccess={onSuccess}
      >
        <TransactionButton className="mt-0 mr-auto ml-auto w-[450px] max-w-full text-[white]">
          Deploy Contract
        </TransactionButton>
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
    </div>
  );
}
