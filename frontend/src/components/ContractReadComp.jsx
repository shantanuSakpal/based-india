import React, { useState } from 'react';
import { readContract } from '@wagmi/core';
import { config } from "@/utils/config";
import { formatUnits } from 'viem';

// Utility function to parse ABI output
const parseOutputData = (data, outputs) => {
    if (!data || !outputs) return null;

    // Handle single output
    if (outputs.length === 1) {
        return formatValue(data, outputs[0].type);
    }

    // Handle multiple outputs
    if (Array.isArray(data)) {
        return outputs.reduce((acc, output, index) => {
            acc[output.name || `output${index}`] = formatValue(data[index], output.type);
            return acc;
        }, {});
    }

    return data;
};

// Enhanced format value function
const formatValue = (value, type) => {
    if (value === undefined || value === null) return null;

    // Handle arrays
    if (type.includes('[]')) {
        return Array.isArray(value)
            ? value.map(item => formatValue(item, type.replace('[]', '')))
            : value;
    }

    // Handle common types
    switch (type) {
        case 'address':
            return value.toLowerCase();
        case 'bool':
            return Boolean(value);
        case 'string':
            // Handle empty string case
            return value === '0x' ? '' : value;
        default:
            // Handle uint/int types
            if (type.startsWith('uint')) {
                try {
                    return formatUnits(value, 0);
                } catch {
                    return value.toString();
                }
            }
            if (type.startsWith('int')) {
                return value.toString();
            }
            return value;
    }
};

const ContractReadFunction = ({
                                  func,
                                  address,
                                  abi,
                                  results,
                                  setResults
                              }) => {
    const [error, setError] = useState(null);

    // Get input values from results
    const inputs = results[func.name]?.inputs || {};
    const args = Object.values(inputs);

    // Find output definition from ABI
    const outputDefinition = func.outputs || [];

    const handleRead = async () => {
        try {
            console.log("Calling view function", func.name, "with args:", args);

            // Enhanced contract call with explicit configuration
            const data = await readContract(config, {
                address: address,
                abi: abi,
                functionName: func.name,
                args: args.length > 0 ? args : undefined,
                // Add additional options for troubleshooting
                account: undefined, // explicitly set to undefined for read calls
                chainId: config.chainId,
            });

            console.log("Raw response:", data);

            // Special handling for string returns
            let parsedData;
            if (outputDefinition.length === 1 && outputDefinition[0].type === 'string' && data === '0x') {
                parsedData = '';
            } else {
                parsedData = parseOutputData(data, outputDefinition);
            }

            setResults(prev => ({
                ...prev,
                [func.name]: {
                    ...prev[func.name],
                    result: parsedData,
                    error: null,
                    timestamp: Date.now()
                }
            }));

            console.log("Parsed data:", parsedData);

        } catch (err) {
            console.error("Error reading contract:", err);

            // Enhanced error handling
            let errorMessage = err.message;
            if (err.cause) {
                errorMessage += `\nCause: ${err.cause}`;
            }

            setError(errorMessage);

            setResults(prev => ({
                ...prev,
                [func.name]: {
                    ...prev[func.name],
                    result: null,
                    error: errorMessage,
                    timestamp: Date.now()
                }
            }));
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    onClick={handleRead}
                >
                    {`Call ${func.name}`}
                </button>


            </div>

            {error && (
                <div className="text-red-500 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ContractReadFunction;