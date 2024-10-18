"use client";
import React, {useState, useContext, useEffect} from "react";
import {Avatar, Button, Card, CardBody, CardHeader} from "@nextui-org/react";
import {ethers} from "ethers";
import SolidityEditor from "@/components/SolidityEditor";
import axios from "axios";
import WalletConnectButton from "@/components/WalletConnectButton"
import {useAccount} from "wagmi";
import {useSolidityCodeAgent} from "@/hooks/useSolidityCodeAgent";
import {FaClipboard, FaClipboardCheck} from "react-icons/fa";
import {Toaster, toast} from "react-hot-toast";
import {useContractState} from "@/contexts/ContractContext";
import {saveContractData, saveSolidityCode} from "@/lib/contractService";
import {GlobalContext} from "@/contexts/UserContext";
import ContractInteraction from "@/components/ContractInteractions";
import {PRIVATE_KEY} from "@/utils/config";

export default function Editor() {
    const {
        agentResponse,
        handleRunAgent,
        inputDisabled,
        setAgentResponse,
        progressMessage,
    } = useSolidityCodeAgent();
    const [userPrompt, setUserPrompt] = useState("");
    const [result, setResult] = useState(null);
    const {setContractState, contractState} = useContractState();
    const {account, isConnected} = useAccount();
    const [isCompiling, setCompiling] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState(null);
    const {userData} = useContext(GlobalContext);

    useEffect(() => {
        const loadedCode = localStorage.getItem('loadedContractCode');
        if (loadedCode) {
            setAgentResponse(loadedCode);
            // Clear the stored code after loading
        }
    }, []);


    const compileCode = async () => {
        setCompiling(true);
        try {
            const formData = new FormData();
            formData.append(
                "file",
                new Blob([agentResponse], {type: "text/plain"}),
                "Contract.sol"
            );
            const response = await axios.post(
                "https://msl8g5vbv6.execute-api.ap-south-1.amazonaws.com/prod/api/contract/compile",
                formData,
                {
                    headers: {"Content-Type": "multipart/form-data"},
                }
            );
            setResult(response.data);
            if (response.data.status === "success") {
                setContractState((prevState) => ({
                    ...prevState,
                    abi: response.data.abi,
                    bytecode: response.data.bytecode,
                    isCompiled: true,
                }));
            }
        } catch (error) {
            setResult({error: error.message});
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
            setIsDeploying(true);

            // Create provider for Base Sepolia testnet
            const provider = new ethers.providers.JsonRpcProvider(
                "https://sepolia.base.org" // or your preferred RPC URL
            );

            // Create wallet from private key
            if (!PRIVATE_KEY) {
                toast.error("Please enter a private key");
                return;
            }

            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

            // Check if the network is correct
            const network = await provider.getNetwork();
            console.log("Network chainId:", network.chainId);

            if (network.chainId !== 8453 && network.chainId !== 84532) {
                toast.error(
                    "Provider is not connected to Base Mainnet or Base Sepolia Testnet."
                );
                return;
            }

            // Create contract factory with the wallet
            const contractFactory = new ethers.ContractFactory(
                result.abi,
                result.bytecode,
                wallet
            );

            console.log("Deploying contract...");
            const contract = await contractFactory.deploy();
            await contract.deployed();

            // Determine block explorer URL based on the network
            const blockExplorerUrl =
                network.chainId === 8453
                    ? `https://basescan.org/address/${contract.address}`
                    : `https://sepolia.basescan.org/address/${contract.address}`;

            const solidityCode = agentResponse;
            const fileName = `Contract_${contract.address}.sol`;
            const solidityFilePath = await saveSolidityCode(solidityCode, fileName);

            // Prepare and save contract data
            const contractData = {
                chainId: network.chainId,
                contractAddress: contract.address,
                abi: result.abi,
                bytecode: result.bytecode,
                blockExplorerUrl: blockExplorerUrl,
                solidityFilePath: solidityFilePath,
                deploymentDate: new Date().toISOString(),
            };

            if (userData && userData.email) {
                await saveContractData(contractData, userData.email);
            } else {
                console.error("User email not available");
            }

            await setContractState((prevState) => ({
                ...prevState,
                address: contract.address,
                isDeployed: true,
                blockExplorerUrl: blockExplorerUrl,
            }));

            toast.success(
                <div>
                    Contract deployed successfully!
                    <a
                        href={blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-black-500 hover:underline"
                    >
                        View on Block Explorer
                    </a>
                </div>,
                {duration: 5000}
            );
            console.log(`Contract deployed at: ${contract.address}`);
        } catch (error) {
            setError(error);
            console.error("Error deploying contract:", error);
            if (error.code === "INVALID_ARGUMENT") {
                toast.error("Invalid private key");
            } else {
                toast.error(`Error deploying contract: ${error.message}`);
            }
        } finally {
            setIsDeploying(false);
        }
    };

    const handleCodeChange = (code) => {
        setAgentResponse(code);
        localStorage.setItem('loadedContractCode', code);
    };

    //useEffect to monitor sugeestion changes and compile code
    const RenderResult = () => {
        const [ABIcopied, setABICopied] = useState(false);
        const [Bytecopied, setByteCopied] = useState(false);

        const copyToClipboard = (text, ele) => {
            console.log(contractState);
            navigator.clipboard.writeText(text);
        };

        if (!result) {
            return (
                <div className="bg-gray-100 border border-gray-400 text-black p-4 rounded">
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

                    {/*copy abi and bytecode*/}
                    {/*<div className=" p-4 rounded flex items-center space-x-4 justify-end my-2">*/}
                    {/*   <Button*/}
                    {/*     color="primary"*/}
                    {/*     className="flex gap-2 items-center"*/}
                    {/*     onClick={() => {*/}
                    {/*       copyToClipboard(result.bytecode, 1);*/}
                    {/*     }}*/}
                    {/*   >*/}
                    {/*     <h4 className="">*/}
                    {/*       {Bytecopied ? "Bytecode Copied" : "Copy Bytecode"}*/}
                    {/*     </h4>*/}
                    {/*     {Bytecopied ? <FaClipboardCheck /> : <FaClipboard />}*/}
                    {/*   </Button>*/}
                    {/*   <Button*/}
                    {/*     color="primary"*/}
                    {/*     className="flex gap-2 items-center"*/}
                    {/*     onClick={() => {*/}
                    {/*       copyToClipboard(JSON.stringify(result.abi), 0);*/}
                    {/*     }}*/}
                    {/*   >*/}
                    {/*     <h4 className="">{ABIcopied ? "ABI Copied" : "Copy ABI"}</h4>*/}
                    {/*     {ABIcopied ? <FaClipboardCheck /> : <FaClipboard />}*/}
                    {/*   </Button>*/}
                    {/* </div>*/}
                </div>
            );
        }

        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded">
                Error while compilation!.
            </div>
        );
    };

    return (
        <div className="">
            <Toaster/>
            <div className="flex ">
                <div className="w-1/2 p-2">
                    <Card className="flex-grow h-full p-6">
                        <div className="max-w-2xl bg-gray-100 p-4 rounded-lg shadow-md">
                            <div className="flex items-center space-x-4">
                                <Avatar isBordered radius="md" src="/chain/base-logo.png"/>
                                <div className="flex-grow">
                                    {isConnected ? (
                                        <div className="flex items-center justify-between">
                      <span className="text-green-600 font-semibold">
                        Connected
                      </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">Not connected</span>
                                    )}
                                </div>
                                <WalletConnectButton/>
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
                            {
                                isConnected ? (
                                    <Button
                                        disabled={inputDisabled}
                                        onClick={() => handleRunAgent(userPrompt)}
                                        color="primary"
                                    >
                                        {inputDisabled ? progressMessage : "Generate code"}
                                    </Button>
                                ):(
                                  <WalletConnectButton
                                  text="Connect Wallet to Generate Code"
                                  />
                                )
                            }
                        </div>

                        <div className="my-5">
                            <RenderResult/>
                        </div>
                        {isConnected ? (
                            <ContractInteraction/>
                        ) : (
                            <div className="text-gray-600 ">
                                <p className="p-2 ">
                                    Please connect your wallet to compile and deploy the contract
                                </p>

                            </div>
                        )}
                    </Card>
                </div>
                <div className="w-1/2 p-4 flex flex-col">
                    <Card className="flex-grow">
                        <CardHeader className="flex justify-between items-center px-4 py-2">
                            <div className="flex items-center">
                                <h2 className="text-xl font-bold">Base</h2>
                            </div>

                            {/*compile and deploy buttons*/}
                            {
                                isConnected && (
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
                                )
                            }
                        </CardHeader>
                        <CardBody className="p-4 h-full">
                            <div
                                className="h-full overflow-auto"
                                style={{maxHeight: "calc(100vh - 200px)"}}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex-grow h-screen">
                                        <SolidityEditor
                                            code={agentResponse}
                                            defaultValue={"// Solidity code will appear here"}
                                            onChange={handleCodeChange}
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
