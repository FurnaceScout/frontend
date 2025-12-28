'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/lib/viem';

export default function ContractInteraction({ address, abiData }) {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [inputs, setInputs] = useState({});
  const [readResult, setReadResult] = useState(null);
  const [activeTab, setActiveTab] = useState('read');

  const { address: walletAddress, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, isPending: isWriting, isSuccess: writeSuccess, error: writeError } = useWriteContract();

  const readFunctions = abiData.abi.filter(
    (item) => item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure')
  );

  const writeFunctions = abiData.abi.filter(
    (item) =>
      item.type === 'function' &&
      item.stateMutability !== 'view' &&
      item.stateMutability !== 'pure'
  );

  const handleInputChange = (inputName, value) => {
    setInputs((prev) => ({ ...prev, [inputName]: value }));
  };

  const handleRead = async (func) => {
    setSelectedFunction(func);
    setReadResult(null);

    try {
      // Prepare args
      const args = func.inputs?.map((input) => {
        const value = inputs[input.name] || '';

        // Parse based on type
        if (input.type.includes('uint') || input.type.includes('int')) {
          return BigInt(value || 0);
        }
        if (input.type === 'bool') {
          return value === 'true' || value === '1';
        }
        if (input.type.includes('[]')) {
          return JSON.parse(value || '[]');
        }
        return value;
      }) || [];

      // Create a minimal ABI with just this function
      const functionAbi = [func];

      // Use viem's readContract
      const result = await publicClient.readContract({
        address,
        abi: functionAbi,
        functionName: func.name,
        args,
      });

      setReadResult({
        success: true,
        data: result,
        function: func.name,
      });
    } catch (error) {
      setReadResult({
        success: false,
        error: error.message,
        function: func.name,
      });
    }
  };

  const handleWrite = async (func) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedFunction(func);

    try {
      // Prepare args
      const args = func.inputs?.map((input) => {
        const value = inputs[input.name] || '';

        if (input.type.includes('uint') || input.type.includes('int')) {
          return BigInt(value || 0);
        }
        if (input.type === 'bool') {
          return value === 'true' || value === '1';
        }
        if (input.type.includes('[]')) {
          return JSON.parse(value || '[]');
        }
        return value;
      }) || [];

      writeContract({
        address,
        abi: abiData.abi,
        functionName: func.name,
        args,
      });
    } catch (error) {
      console.error('Write error:', error);
    }
  };

  const renderInputField = (input) => {
    const value = inputs[input.name] || '';

    if (input.type === 'bool') {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(input.name, e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">Select...</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    if (input.type.includes('[]')) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(input.name, e.target.value)}
          placeholder='["item1", "item2"]'
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
          rows={3}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(input.name, e.target.value)}
        placeholder={`${input.type}`}
        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
      />
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Contract Interaction
        </h2>

        {/* Wallet Connection */}
        <div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <button
                onClick={() => disconnect()}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('read')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'read'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Read ({readFunctions.length})
        </button>
        <button
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'write'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Write ({writeFunctions.length})
        </button>
      </div>

      {/* Read Functions */}
      {activeTab === 'read' && (
        <div className="space-y-4">
          {readFunctions.length > 0 ? (
            readFunctions.map((func, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
              >
                <div className="font-mono font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  {func.name}
                </div>

                {func.inputs && func.inputs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {func.inputs.map((input, inputIdx) => (
                      <div key={inputIdx}>
                        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                          {input.name} ({input.type})
                        </label>
                        {renderInputField(input)}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleRead(func)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
                >
                  Query
                </button>

                {/* Result */}
                {readResult && readResult.function === func.name && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    {readResult.success ? (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Result:</div>
                        <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                          {typeof readResult.data === 'bigint'
                            ? readResult.data.toString()
                            : JSON.stringify(readResult.data)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-500 text-sm">{readResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-500">No read functions available</div>
          )}
        </div>
      )}

      {/* Write Functions */}
      {activeTab === 'write' && (
        <div className="space-y-4">
          {!isConnected && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
              Connect your wallet to interact with write functions
            </div>
          )}

          {writeFunctions.length > 0 ? (
            writeFunctions.map((func, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
              >
                <div className="font-mono font-semibold text-red-600 dark:text-red-400 mb-3">
                  {func.name}
                </div>

                {func.inputs && func.inputs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {func.inputs.map((input, inputIdx) => (
                      <div key={inputIdx}>
                        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                          {input.name} ({input.type})
                        </label>
                        {renderInputField(input)}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleWrite(func)}
                  disabled={!isConnected || isWriting}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-zinc-400 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  {isWriting && selectedFunction === func ? 'Writing...' : 'Write'}
                </button>

                {writeSuccess && selectedFunction === func && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-sm">
                    Transaction submitted successfully!
                  </div>
                )}

                {writeError && selectedFunction === func && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                    {writeError.message}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-500">No write functions available</div>
          )}
        </div>
      )}
    </div>
  );
}
