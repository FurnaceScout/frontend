"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { getAllABIs } from "@/lib/abi-store";
import { useRecentEventLogs } from "@/app/hooks/useBlockchainQueries";
import { shortenAddress } from "@/lib/viem";

export default function EventsPage() {
  const [filters, setFilters] = useState({
    address: "",
    fromBlock: "",
    toBlock: "",
    eventName: "",
  });
  const [availableContracts, setAvailableContracts] = useState([]);
  const [searchTriggered, setSearchTriggered] = useState(0);

  // Load available contracts from ABI store
  useEffect(() => {
    const abis = getAllABIs();
    const contracts = Object.entries(abis).map(([addr, data]) => ({
      address: addr,
      name: data.name,
    }));
    setAvailableContracts(contracts);
  }, []);

  // Use React Query hook for fetching events
  const {
    data: events = [],
    isLoading: loading,
    refetch,
  } = useRecentEventLogs(
    100,
    {
      address: filters.address,
      eventName: filters.eventName,
    },
    {
      // Refetch when search is triggered
      refetchOnMount: true,
    },
  );

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTriggered((prev) => prev + 1);
    refetch();
  };

  const handleReset = () => {
    setFilters({
      address: "",
      fromBlock: "",
      toBlock: "",
      eventName: "",
    });
    setTimeout(() => refetch(), 0);
  };

  const exportToCSV = () => {
    const headers = ["Block", "Transaction", "Contract", "Event", "Data"];
    const rows = events.map((event) => [
      event.blockNumber?.toString() || "",
      event.transactionHash || "",
      event.address || "",
      event.decoded?.eventName || "Unknown",
      event.decoded?.args
        ? JSON.stringify(event.decoded.args)
        : JSON.stringify(event.data),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Event Logs</h1>
        <p className="text-muted-foreground">
          View and filter contract events across blocks
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Contract Address Filter */}
              <div className="space-y-2">
                <Label htmlFor="contract-address">Contract Address</Label>
                {availableContracts.length > 0 ? (
                  <Select
                    value={filters.address || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "address",
                        value === "all" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger id="contract-address">
                      <SelectValue placeholder="All Contracts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contracts</SelectItem>
                      {availableContracts.map((contract) => (
                        <SelectItem
                          key={contract.address}
                          value={contract.address}
                        >
                          {contract.name || shortenAddress(contract.address)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="contract-address"
                    type="text"
                    value={filters.address}
                    onChange={(e) =>
                      handleFilterChange("address", e.target.value)
                    }
                    placeholder="0x..."
                    className="font-mono"
                  />
                )}
              </div>

              {/* Event Name Filter */}
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  type="text"
                  value={filters.eventName}
                  onChange={(e) =>
                    handleFilterChange("eventName", e.target.value)
                  }
                  placeholder="Transfer, Approval..."
                />
              </div>

              {/* From Block */}
              <div className="space-y-2">
                <Label htmlFor="from-block">From Block</Label>
                <Input
                  id="from-block"
                  type="number"
                  value={filters.fromBlock}
                  onChange={(e) =>
                    handleFilterChange("fromBlock", e.target.value)
                  }
                  placeholder="Latest - 100"
                />
              </div>

              {/* To Block */}
              <div className="space-y-2">
                <Label htmlFor="to-block">To Block</Label>
                <Input
                  id="to-block"
                  type="number"
                  value={filters.toBlock}
                  onChange={(e) =>
                    handleFilterChange("toBlock", e.target.value)
                  }
                  placeholder="Latest"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "🔍 Search Events"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                Reset
              </Button>
              {events.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportToCSV}
                  className="ml-auto bg-green-600 hover:bg-green-700 text-white"
                >
                  📥 Export CSV
                </Button>
              )}
            </div>
          </form>

          {/* Info Banner */}
          <Card className="mt-4 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> Upload contract ABIs to see decoded
                event data. Without ABIs, only raw event data is shown.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events ({events.length})</CardTitle>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading events...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!loading && events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold mb-1">No events found</div>
              <div className="text-sm">
                Try adjusting your filters or block range
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <Card
                  key={`${event.transactionHash}-${event.logIndex}-${index}`}
                  className="hover:border-primary transition-colors"
                >
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {event.decoded ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              DECODED
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              RAW
                            </Badge>
                          )}
                          <span className="font-mono text-sm font-semibold text-primary">
                            {event.decoded?.eventName || "Unknown Event"}
                          </span>
                          {event.contractName && (
                            <span className="text-xs text-muted-foreground">
                              ({event.contractName})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Log Index: {event.logIndex?.toString()}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>
                          Block{" "}
                          <Link
                            href={`/block/${event.blockNumber}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {event.blockNumber?.toString()}
                          </Link>
                        </div>
                        <div>
                          {new Date(
                            Number(event.timestamp) * 1000,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Contract & Transaction */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Contract
                        </div>
                        <Link
                          href={`/address/${event.address}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {shortenAddress(event.address)}
                        </Link>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Transaction
                        </div>
                        <Link
                          href={`/tx/${event.transactionHash}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {shortenAddress(event.transactionHash, 8)}
                        </Link>
                      </div>
                    </div>

                    {/* Event Data */}
                    {event.decoded?.args ? (
                      <div className="bg-muted p-3 rounded">
                        <div className="text-xs text-muted-foreground mb-2 font-semibold">
                          Decoded Arguments:
                        </div>
                        <pre className="font-mono text-xs overflow-x-auto">
                          {JSON.stringify(
                            event.decoded.args,
                            (_, v) =>
                              typeof v === "bigint" ? v.toString() : v,
                            2,
                          )}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-muted p-3 rounded">
                        <div className="text-xs text-muted-foreground mb-2 font-semibold">
                          Raw Data:
                        </div>
                        <div className="font-mono text-xs break-all">
                          {event.data}
                        </div>
                        {event.error && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            ⚠ {event.error}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
