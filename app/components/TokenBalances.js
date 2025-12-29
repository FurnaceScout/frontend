"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  extractTokenAddresses,
  formatTokenAmount,
  getTokenBalances,
} from "@/lib/tokens";
import { shortenAddress } from "@/lib/viem";

export default function TokenBalances({ address, transactions }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTokenBalances() {
      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract token addresses from transaction history
        const tokenAddresses = extractTokenAddresses(transactions);

        if (tokenAddresses.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch balances for all discovered tokens
        const balances = await getTokenBalances(address, tokenAddresses);
        setTokens(balances);
      } catch (err) {
        console.error("Error fetching token balances:", err);
        setError("Failed to load token balances");
      } finally {
        setLoading(false);
      }
    }

    fetchTokenBalances();
  }, [address, transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🪙</div>
            <div className="text-muted-foreground">No token balances found</div>
            <div className="text-xs text-muted-foreground mt-2">
              Tokens will appear here after transactions
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTokenBadgeVariant = (type) => {
    switch (type) {
      case "ERC20":
        return "default";
      case "ERC721":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Token Balances</CardTitle>
          <Badge variant="secondary">
            {tokens.length} token{tokens.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.map((token, index) => (
          <Link
            key={`${token.token}-${index}`}
            href={`/address/${token.token}`}
            className="block p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Token Type Badge */}
                  <Badge variant={getTokenBadgeVariant(token.type)}>
                    {token.type}
                  </Badge>

                  {/* Token Name/Symbol */}
                  <span className="font-semibold">
                    {token.metadata?.name || "Unknown Token"}
                  </span>
                  {token.metadata?.symbol && (
                    <span className="text-sm text-muted-foreground">
                      ({token.metadata.symbol})
                    </span>
                  )}
                </div>

                {/* Token Address */}
                <div className="font-mono text-xs text-muted-foreground">
                  {shortenAddress(token.token, 6)}
                </div>
              </div>

              {/* Balance */}
              <div className="text-right ml-4">
                <div className="font-bold">
                  {token.type === "ERC20"
                    ? formatTokenAmount(
                        BigInt(token.balance),
                        token.metadata?.decimals || 18,
                      )
                    : token.balance}{" "}
                  {token.type === "ERC721" && (
                    <span className="text-xs text-muted-foreground">
                      NFT{token.balance !== "1" ? "s" : ""}
                    </span>
                  )}
                </div>
                {token.type === "ERC20" && token.metadata?.totalSupply && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Supply:{" "}
                    {formatTokenAmount(
                      BigInt(token.metadata.totalSupply),
                      token.metadata.decimals || 18,
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* Info Footer */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground text-center">
            💡 Token balances are detected from transaction history
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
