"use client";
import React, { useState, useContext } from "react";
import { Avatar, Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { ethers } from "ethers";
import SolidityEditor from "@/components/SolidityEditor";
import axios from "axios";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useAccount } from "wagmi";
import { solidityCodeAgent } from "@/hooks/solidityCodeAgent";
import { FaClipboard, FaClipboardCheck } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useContractState } from "@/contexts/ContractContext";
import { saveContractData, saveSolidityCode } from "@/lib/contractService";
import { GlobalContext } from "@/contexts/UserContext";

export default function Editor() {
  const { agentResponse, handleRunAgent, inputDisabled } = solidityCodeAgent();
  const [userPrompt, setUserPrompt] = useState("");
  const [result, setResult] = useState(null);
  const { setContractState, contractState } = useContractState();
  const account = useAccount();
  const [isCompiling, setCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const { userData } = useContext(GlobalContext);

    const compileCode = async () => {
        setCompiling(true);
        try {
          const formData = new FormData();
          formData.append(
            "file",
            new Blob([suggestions], { type: "text/plain" }),
            "Contract.sol"
          );
          const response = await axios.post(
            "https://msl8g5vbv6.execute-api.ap-south-1.amazonaws.com/prod/api/contract/compile",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          setResult(response.data);
          console.log(response.data);
          
          // Update the shared contract state
          if (response.data.status === "success") {
            setContractState(prevState => ({
                ...prevState,
                abi: response.data.abi,
                bytecode: response.data.bytecode,
                isCompiled: true,
              }));
          }
        } catch (error) {
          setResult({ error: error.message });
        } finally {
          setCompiling(false);
        }
      };


      const DeployContract = async () => {
        if (!result || result.status !== "success") {
            toast.error("Please compile the contract successfully before deploying.");
            return;
        }
        console.log("Deploying contract...");
    
        try {
            // Prompt user to connect their wallet if not connected
            if (!window.ethereum) {
                toast.error("Please install MetaMask to deploy the contract.");
                return;
            }
            console.log("Requesting MetaMask connection...");
    
            // Request to connect to MetaMask
            await window.ethereum.request({ method: "eth_requestAccounts" });
    
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            console.log("Connected to MetaMask.");
    
            // Check if the user is on the correct network (Base Mainnet or Base Sepolia Testnet)
            const network = await provider.getNetwork();
            console.log(network.chainId);
    
            if (network.chainId !== 8453 && network.chainId !== 84532) {
                toast.error("Please switch to either Base Mainnet or Base Sepolia Testnet in MetaMask.");
                return;
            }
    
            setIsDeploying(true);
    
            // Create a new contract factory for deployment
            const contractFactory = new ethers.ContractFactory(result.abi, result.bytecode, signer);
            console.log("Deploying contract...");
    
            // Deploy the contract
            const contract = await contractFactory.deploy();
            await contract.deployed();
    
            // Determine block explorer URL based on the network
            const blockExplorerUrl = network.chainId === 8453
                ? `https://basescan.org/address/${contract.address}`
                : `https://sepolia.basescan.org/address/${contract.address}`;
    
            const solidityCode = suggestions; // Assuming suggestions holds your Solidity code
            const fileName = `Contract_${contract.address}.sol`; // Generate a unique file name
            const solidityFilePath = await saveSolidityCode(solidityCode, fileName); // Save the Solidity code and get the file path
    
            // Prepare contract data to save
            const contractData = {
                chainId: network.chainId,
                contractAddress: contract.address,
                abi: result.abi,
                bytecode: result.bytecode,
                blockExplorerUrl: blockExplorerUrl,
                solidityFilePath: solidityFilePath,
                deploymentDate: new Date().toISOString(),
            };
    
            // Get user email from context
            if (userData && userData.email) {
                await saveContractData(contractData, userData.email);
            } else {
                console.error("User email not available");
            }
    
            await setContractState(prevState => ({
                ...prevState,
                address: contract.address,
                isDeployed: true,
                blockExplorerUrl: blockExplorerUrl,
            }));
    
            toast.success(
                <div>
                    Contract deployed successfully!
                    <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-black-500 hover:underline">
                        View on Block Explorer
                    </a>
                </div>,
                { duration: 5000 }
            );
            console.log(`Contract deployed at: ${contract.address}`);
        } catch (error) {
            console.error("Error deploying contract:", error);
            toast.error("Failed to deploy contract. Check the console for details.");
        } finally {
            setIsDeploying(false);
        }
    };
    


  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  //useEffect to monitor sugeestion changes and compile code
  const RenderResult = () => {
    const [ABIcopied, setABICopied] = useState(false);
    const [Bytecopied, setByteCopied] = useState(false);

    const copyToClipboard = (text, ele) => {
      console.log(text);
      navigator.clipboard.writeText(text);
    };

    if (!result) {
      return (
        <div className="text-gray-600 ">
          Compilation results will appear here.
        </div>
      );
    }

    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      return (
        <div>
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
            <h3 className="font-bold">Compilation failed!</h3>
            <p>{error.message}</p>
          </div>
        </div>
      );
    }

    if (result.status === "success") {
      return (
        <div>
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
            <h3 className="font-bold">Compilation Successful!</h3>
          </div>
          <div className=" p-4 rounded flex items-center space-x-4 justify-end my-2">
            <Button
              color="primary"
              className="flex gap-2 items-center"
              onClick={() => {
                copyToClipboard(result.bytecode, 1);
              }}
            >
              <h4 className="">
                {Bytecopied ? "Bytecode Copied" : "Copy Bytecode"}
              </h4>
              {Bytecopied ? <FaClipboardCheck /> : <FaClipboard />}
            </Button>
            <Button
              color="primary"
              className="flex gap-2 items-center"
              onClick={() => {
                copyToClipboard(JSON.stringify(result.abi), 0);
              }}
            >
              <h4 className="">{ABIcopied ? "ABI Copied" : "Copy ABI"}</h4>
              {ABIcopied ? <FaClipboardCheck /> : <FaClipboard />}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded">
        Unexpected result format.
      </div>
    );
  };

  return (
    <div className="">
      <Toaster />
      <div className="flex ">
        <div className="w-1/2 p-2">
          <Card className="flex-grow h-full p-6">
            <div className="max-w-2xl bg-gray-100 p-4 rounded-lg shadow-md">
              <div className="flex items-center space-x-4">
                <Avatar isBordered radius="md" src="/chain/base-logo.png" />
                <div className="flex-grow">
                  {account.isConnected ? (
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-semibold">
                        Connected
                      </span>
                      <span className="text-gray-600 text-sm">
                        {shortenAddress(account?.address)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600">Not connected</span>
                  )}
                </div>
                <WalletConnectButton />
              </div>
            </div>
            <div className="my-3 h-48 mb-14">
              <h1 className="font-bold my-2">Describe your smart contract</h1>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full h-full p-4 rounded-xl border"
                placeholder="E.g. I want to create a smart contract that allows users to create a token"
              />
            </div>

            <div className="max-w-xl">
              <Button
                disabled={inputDisabled}
                onClick={() => handleRunAgent(userPrompt)}
                color="default"
              >
                {inputDisabled ? "Generating..." : "Generate code"}
              </Button>
            </div>

            <div className="my-5">
              <RenderResult />
            </div>
          </Card>
        </div>
        <div className="w-1/2 p-4 flex flex-col">
          <Card className="flex-grow">
            <CardHeader className="flex justify-between items-center px-4 py-2">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">Base</h2>
              </div>
              <div className="py-2">
                <Button
                  color="default"
                  onClick={compileCode}
                  isLoading={isCompiling}
                >
                  {isCompiling ? "Compiling..." : "Compile"}
                </Button>
                <Button
                  color="success"
                  onClick={DeployContract}
                  isLoading={isDeploying}
                  className="ml-4"
                >
                  {isDeploying ? "Deploying..." : "Deploy"}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4 h-full">
              <div
                className="h-full overflow-auto"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow h-screen">
                    <SolidityEditor
                      code={agentResponse}
                      defaultValue={"// Solidity code will appear here"}
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
