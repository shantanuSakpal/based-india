import { useState, useCallback, useEffect, useMemo } from "react";
import { ethers } from 'ethers';
import SolidityCodeAgentABI from '../utils/SolidityCodeAgentABI.json';

type UseHederaCodeAgentContract = {
    code: string;
    setCode: (code: string) => void;
    userPrompt: string;
    setUserPrompt: (prompt: string) => void;
    suggestions: string | null;
    loading: boolean;
    error: string | null;
    isErrorModalOpen: boolean;
    handleCloseErrorModal: () => void;
    handleRunAgent: (prompt: string) => void;
    setError: (error: string) => void;
    progressMessage: string;
    setSuggestions: (suggestions: string | null) => void;
    handleOpenErrorModal: (message: string) => void;
};

export function useHederaCodeAgentContract(): UseHederaCodeAgentContract {
    const [code, setCode] = useState('');
    const [userPrompt, setUserPrompt] = useState('');
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [ethersProvider, setEthersProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');

    const codeGenerationMessages = useMemo(() => [
        'Understanding your question...',
        'Retrieving knowledge base...',
        'Finding answers...',
        'Generating answers...',
        "Almost there...",
    ], []);

    const handleOpenErrorModal = (message: string) => {
        setError(message);
        setIsErrorModalOpen(true);
    };

    const handleCloseErrorModal = () => {
        setIsErrorModalOpen(false);
    };

    useEffect(() => {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL_GALADRIEL);
        setEthersProvider(provider);
        console.log('Hedera provider initialized');
    }, []);

    const wallet = useMemo(() => {
        if (ethersProvider && process.env.NEXT_PUBLIC_GALADRIEL_PRIVATEKEY) {
            const w = new ethers.Wallet(process.env.NEXT_PUBLIC_GALADRIEL_PRIVATEKEY, ethersProvider);
            console.log('Wallet initialized with address:', w.address);
            return w;
        }
    }, [ethersProvider]);

    const contractAddress = process.env.NEXT_PUBLIC_HEDERA_AGENT_CONTRACT_ADDRESS ?? '';

    const contract = useMemo(() => {
        if (wallet) {
            const c = new ethers.Contract(contractAddress, SolidityCodeAgentABI, wallet);
            console.log('Contract initialized at address:', contractAddress);
            return c;
        }
    }, [contractAddress, wallet]);

    const runAgent = useCallback(async (query: string, maxIterations: number) => {
        if (!contract) {
            console.error('Contract not initialized');
            throw new Error("Contract is not initialized");
        }
        console.log('Running agent with query:', query);
        const tx = await contract.runAgent(query, maxIterations);
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        const event = receipt.events?.find((event: { event: string; }) => event.event === 'AgentRunCreated');
        return event?.args[1].toNumber();
    }, [contract]);

    const getMessageHistoryContents = useCallback(async (agentId: number) => {
        if (!contract) {
            console.error('Contract not initialized');
            throw new Error("Contract is not initialized");
        }
        console.log('Getting message history for agent ID:', agentId);
        return await contract.getMessageHistoryContents(agentId);
    }, [contract]);

    const isRunFinished = useCallback(async (runId: number) => {
        if (!contract) {
            console.error('Contract not initialized');
            throw new Error("Contract is not initialized");
        }
        console.log('Checking if run is finished for run ID:', runId);
        return await contract.isRunFinished(runId);
    }, [contract]);

    const handleRunAgent = useCallback(async (prompt: string) => {
        if (!prompt) {
            handleOpenErrorModal('Please enter some prompt.');
            return;
        }

        const maxIterations = 10;

        const codeGenerationQuery = `
            You are an AI assistant specializing in Hedera blockchain technology. Your task is to provide accurate, concise, and helpful responses to user queries about Hedera, using the knowledge base provided to you. Please follow these guidelines:
            
            1. Analyze the user's question carefully: "${prompt}"
            2. Use the provided knowledge base to formulate your response.
            3. If the question relates to code or implementation, provide relevant code snippets or examples.
            4. Give links to official documentation or other resources where appropriate.
            
            Remember to use the knowledge base provided and avoid using any external information, your goal is to assist users in understanding and working with Hedera technology effectively. Tailor your response to best address the user's specific needs and level of expertise.
            `;
        const query = codeGenerationQuery;
        const messages = codeGenerationMessages;

        setLoading(true);
        setError(null);

        console.log('Starting agent run with prompt:', prompt);
        try {
            const runId = await runAgent(query, maxIterations);
            console.log('Agent run started with ID:', runId);

            let finished = false;
            let messageIndex = 0;

            while (!finished) {
                if (messageIndex < messages.length) {
                    setProgressMessage(messages[messageIndex]);
                    console.log('Progress:', messages[messageIndex]);
                    messageIndex++;
                }
                finished = await isRunFinished(runId);
                console.log('Run finished status:', finished);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
            const messageHistoryContents = await getMessageHistoryContents(runId);
            console.log('Message history retrieved');
            setSuggestions(messageHistoryContents[2]);
        } catch (error) {
            console.error('Error running agent:', error);
            handleOpenErrorModal('Error fetching suggestions');
        } finally {
            console.log('Agent run complete');
            setLoading(false);
            setProgressMessage('');
        }

    }, [codeGenerationMessages, getMessageHistoryContents, isRunFinished, runAgent]);

    return {
        code,
        setCode,
        userPrompt,
        setUserPrompt,
        suggestions,
        loading,
        error,
        isErrorModalOpen,
        handleCloseErrorModal,
        handleRunAgent,
        setError,
        progressMessage,
        setSuggestions,
        handleOpenErrorModal,
    };
}