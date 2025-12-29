"use client";

import CastCommandBuilder from "@/app/components/CastCommandBuilder";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function CastBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cast Command Builder</h1>
        <p className="text-muted-foreground">
          Generate Foundry cast commands from a user-friendly interface
        </p>
      </div>

      <div className="max-w-4xl">
        <CastCommandBuilder />
      </div>

      {/* Quick Reference */}
      <Card className="mt-8 max-w-4xl">
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Common Commands</h3>
              <div className="space-y-2 text-muted-foreground font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">Read contract:</span>{" "}
                  <Badge variant="outline" className="font-mono">
                    cast call
                  </Badge>{" "}
                  [address] [signature]
                </div>
                <div>
                  <span className="text-muted-foreground">Write contract:</span>{" "}
                  <Badge variant="outline" className="font-mono">
                    cast send
                  </Badge>{" "}
                  [address] [signature] --private-key
                </div>
                <div>
                  <span className="text-muted-foreground">Check balance:</span>{" "}
                  <Badge variant="outline" className="font-mono">
                    cast balance
                  </Badge>{" "}
                  [address]
                </div>
                <div>
                  <span className="text-muted-foreground">Get receipt:</span>{" "}
                  <Badge variant="outline" className="font-mono">
                    cast receipt
                  </Badge>{" "}
                  [tx-hash]
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Function Signatures</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Function signatures must include the function name and
                  parameter types:
                </p>
                <div className="font-mono text-xs space-y-1 pl-4">
                  <div>✓ transfer(address,uint256)</div>
                  <div>✓ balanceOf(address)</div>
                  <div>✓ approve(address,uint256)</div>
                  <div className="text-destructive">
                    ✗ transfer (missing parameters)
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Value Formats</h3>
              <div className="space-y-2 text-muted-foreground font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">ETH:</span> 1ether,
                  0.5ether
                </div>
                <div>
                  <span className="text-muted-foreground">Wei:</span>{" "}
                  1000000000000000000wei
                </div>
                <div>
                  <span className="text-muted-foreground">Gwei:</span>{" "}
                  1000000000gwei
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Anvil Test Accounts</h3>
              <p className="text-muted-foreground">
                The builder includes Anvil's default test accounts (0-4) with
                pre-funded balances. These private keys are safe to use on local
                Anvil instances only.
              </p>
            </div>

            <Card className="mt-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">
                    ⚠️
                  </span>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Security Warning:</strong> Never use these private
                    keys on mainnet or with real funds. They are publicly known
                    test keys for local development only.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="mt-8 max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Example Commands</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Read Token Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                cast call 0x1234... "balanceOf(address)" 0x5678... --rpc-url
                http://127.0.0.1:8545
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Reads the balance of address 0x5678... from the ERC20 contract
                at 0x1234...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                cast send 0x1234... "transfer(address,uint256)" 0x5678... 100
                --private-key 0xac09... --rpc-url http://127.0.0.1:8545
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Transfers 100 tokens to address 0x5678... using Anvil test
                account #0
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send ETH</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                cast send 0x5678... --value 1ether --private-key 0xac09...
                --rpc-url http://127.0.0.1:8545
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Sends 1 ETH to address 0x5678...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
