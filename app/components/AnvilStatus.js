"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useChainInfo, useWatchBalances } from "@/app/hooks/useBlockchain";
import { formatEther, shortenAddress } from "@/lib/viem";

// Anvil's default test accounts
const ANVIL_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey:
      "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    privateKey:
      "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  },
  {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    privateKey:
      "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  },
  {
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    privateKey:
      "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  },
  {
    address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    privateKey:
      "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  },
  {
    address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    privateKey:
      "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  },
  {
    address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    privateKey:
      "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
  },
];

export default function AnvilStatus({ expanded = false, onToggle }) {
  const [copiedItem, setCopiedItem] = useState(null);

  // Use real-time hooks instead of polling
  const { chainInfo, loading: chainLoading } = useChainInfo();
  const addresses = ANVIL_ACCOUNTS.map((acc) => acc.address);
  const { balances, loading: balancesLoading } = useWatchBalances(addresses);

  const loading = chainLoading || balancesLoading;

  const copyToClipboard = async (text, label) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        document.body.removeChild(textArea);
      }
      setCopiedItem(label);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anvil Status</CardTitle>
          <CardDescription>Loading Anvil status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!chainInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anvil Status</CardTitle>
          <CardDescription className="text-destructive">
            ⚠️ Cannot connect to Anvil
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header - Always Visible */}
      <CardHeader>
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-between h-auto p-0 hover:bg-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <div className="text-left">
              <CardTitle className="text-base">Anvil Connected</CardTitle>
              <CardDescription>
                Chain ID: {chainInfo.chainId} | Block: {chainInfo.blockNumber}
              </CardDescription>
            </div>
          </div>
          <span className="text-muted-foreground">{expanded ? "▼" : "▶"}</span>
        </Button>
      </CardHeader>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Chain Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Chain ID</div>
              <div className="font-mono text-sm font-semibold">
                {chainInfo.chainId}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Current Block
              </div>
              <div className="font-mono text-sm font-semibold">
                {chainInfo.blockNumber}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Gas Price
              </div>
              <div className="font-mono text-sm font-semibold">
                {(Number(chainInfo.gasPrice) / 1e9).toFixed(2)} Gwei
              </div>
            </div>
          </div>

          {/* Test Accounts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Test Accounts</h3>
              <Badge variant="secondary">
                {ANVIL_ACCOUNTS.length} accounts
              </Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ANVIL_ACCOUNTS.map((account, index) => (
                <div
                  key={account.address}
                  className="p-3 bg-muted rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                      >
                        {index}
                      </Badge>
                      <div className="font-mono text-sm">
                        {shortenAddress(account.address, 6)}
                      </div>
                    </div>
                    <div className="font-semibold text-sm">
                      {balances[account.address.toLowerCase()]
                        ? `${formatEther(balances[account.address.toLowerCase()], 2)} ETH`
                        : "Loading..."}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        copyToClipboard(account.address, `addr-${index}`)
                      }
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copiedItem === `addr-${index}`
                        ? "✓ Copied"
                        : "📋 Address"}
                    </Button>
                    <Button
                      onClick={() =>
                        copyToClipboard(account.privateKey, `key-${index}`)
                      }
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copiedItem === `key-${index}`
                        ? "✓ Copied"
                        : "🔑 Private Key"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">
              Quick Actions
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
              <Button
                onClick={() => copyToClipboard("http://127.0.0.1:8545", "rpc")}
                variant="outline"
                size="sm"
              >
                {copiedItem === "rpc" ? "✓ Copied" : "📋 Copy RPC URL"}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
