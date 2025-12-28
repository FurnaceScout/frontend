"use client";

import CastCommandBuilder from "@/app/components/CastCommandBuilder";

export default function CastBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
          Cast Command Builder
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Generate Foundry cast commands from a user-friendly interface
        </p>
      </div>

      <div className="max-w-4xl">
        <CastCommandBuilder />
      </div>

      {/* Quick Reference */}
      <div className="mt-8 max-w-4xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Quick Reference
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Common Commands
            </h3>
            <div className="space-y-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
              <div>
                <span className="text-zinc-500">Read contract:</span>{" "}
                <span className="text-blue-600 dark:text-blue-400">cast call</span> [address] [signature]
              </div>
              <div>
                <span className="text-zinc-500">Write contract:</span>{" "}
                <span className="text-blue-600 dark:text-blue-400">cast send</span> [address] [signature] --private-key
              </div>
              <div>
                <span className="text-zinc-500">Check balance:</span>{" "}
                <span className="text-blue-600 dark:text-blue-400">cast balance</span> [address]
              </div>
              <div>
                <span className="text-zinc-500">Get receipt:</span>{" "}
                <span className="text-blue-600 dark:text-blue-400">cast receipt</span> [tx-hash]
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Function Signatures
            </h3>
            <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <p>
                Function signatures must include the function name and parameter types:
              </p>
              <div className="font-mono text-xs space-y-1 pl-4">
                <div>✓ transfer(address,uint256)</div>
                <div>✓ balanceOf(address)</div>
                <div>✓ approve(address,uint256)</div>
                <div className="text-red-500">✗ transfer (missing parameters)</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Value Formats
            </h3>
            <div className="space-y-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
              <div>
                <span className="text-zinc-500">ETH:</span> 1ether, 0.5ether
              </div>
              <div>
                <span className="text-zinc-500">Wei:</span> 1000000000000000000wei
              </div>
              <div>
                <span className="text-zinc-500">Gwei:</span> 1000000000gwei
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Anvil Test Accounts
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              The builder includes Anvil's default test accounts (0-4) with pre-funded balances.
              These private keys are safe to use on local Anvil instances only.
            </p>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                <strong>Security Warning:</strong> Never use these private keys on mainnet or with real funds.
                They are publicly known test keys for local development only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8 max-w-4xl">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Example Commands
        </h2>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Read Token Balance
            </h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              cast call 0x1234... "balanceOf(address)" 0x5678... --rpc-url http://127.0.0.1:8545
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Reads the balance of address 0x5678... from the ERC20 contract at 0x1234...
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Transfer Tokens
            </h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              cast send 0x1234... "transfer(address,uint256)" 0x5678... 100 --private-key 0xac09... --rpc-url http://127.0.0.1:8545
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Transfers 100 tokens to address 0x5678... using Anvil test account #0
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Send ETH
            </h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              cast send 0x5678... --value 1ether --private-key 0xac09... --rpc-url http://127.0.0.1:8545
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Sends 1 ETH to address 0x5678...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
