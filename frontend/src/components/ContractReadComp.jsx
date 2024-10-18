import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';

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

// Format individual values based on their ABI type
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
            return value;
        default:
            // Handle uint/int types
            if (type.startsWith('uint') || type.startsWith('int')) {
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

    // Setup wagmi contract read hook
    const { data, isError } = useReadContract({
        functionName: func.name,
        abi,
        address,
        args: args,
    });

    // Find output definition from ABI
    const outputDefinition = func.outputs || [];

    const handleRead = async () => {
        try {
            console.log("Calling view function", func.name, "with args:", args);

            if (isError) {
                throw new Error("Contract read failed");
            }

            // Parse the output data according to ABI
            const parsedData = parseOutputData(data, outputDefinition);

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
            setError(err.message);

            setResults(prev => ({
                ...prev,
                [func.name]: {
                    ...prev[func.name],
                    result: null,
                    error: err.message,
                    timestamp: Date.now()
                }
            }));
        }
    };

    return (
        <div>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleRead}
            >
                {`Call ${func.name}`}
            </button>
            {error && (
                <div className="text-red-500 mt-2">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ContractReadFunction;