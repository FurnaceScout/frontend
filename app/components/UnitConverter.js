"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

export default function UnitConverter({ isOpen, onClose }) {
  // Wei/Gwei/ETH converter state
  const [wei, setWei] = useState("");
  const [gwei, setGwei] = useState("");
  const [eth, setEth] = useState("");

  // Hex/Decimal converter state
  const [hexValue, setHexValue] = useState("");
  const [decValue, setDecValue] = useState("");

  // Unix timestamp converter state
  const [unixTimestamp, setUnixTimestamp] = useState("");
  const [dateValue, setDateValue] = useState("");

  // Wei/Gwei/ETH conversions
  function handleWeiChange(value) {
    setWei(value);
    if (value === "") {
      setGwei("");
      setEth("");
      return;
    }
    try {
      const weiNum = BigInt(value);
      setGwei((Number(weiNum) / 1e9).toString());
      setEth((Number(weiNum) / 1e18).toString());
    } catch {
      setGwei("Invalid");
      setEth("Invalid");
    }
  }

  function handleGweiChange(value) {
    setGwei(value);
    if (value === "") {
      setWei("");
      setEth("");
      return;
    }
    try {
      const gweiNum = parseFloat(value);
      if (Number.isNaN(gweiNum)) throw new Error("Invalid");
      const weiNum = BigInt(Math.floor(gweiNum * 1e9));
      setWei(weiNum.toString());
      setEth((gweiNum / 1e9).toString());
    } catch {
      setWei("Invalid");
      setEth("Invalid");
    }
  }

  function handleEthChange(value) {
    setEth(value);
    if (value === "") {
      setWei("");
      setGwei("");
      return;
    }
    try {
      const ethNum = parseFloat(value);
      if (Number.isNaN(ethNum)) throw new Error("Invalid");
      const weiNum = BigInt(Math.floor(ethNum * 1e18));
      setWei(weiNum.toString());
      setGwei((ethNum * 1e9).toString());
    } catch {
      setWei("Invalid");
      setGwei("Invalid");
    }
  }

  // Hex/Decimal conversions
  function handleHexChange(value) {
    setHexValue(value);
    if (value === "") {
      setDecValue("");
      return;
    }
    try {
      const cleaned = value.replace(/^0x/, "");
      const decimal = BigInt(`0x${cleaned}`);
      setDecValue(decimal.toString());
    } catch {
      setDecValue("Invalid");
    }
  }

  function handleDecChange(value) {
    setDecValue(value);
    if (value === "") {
      setHexValue("");
      return;
    }
    try {
      const decimal = BigInt(value);
      setHexValue(`0x${decimal.toString(16)}`);
    } catch {
      setHexValue("Invalid");
    }
  }

  // Unix timestamp conversions
  function handleUnixChange(value) {
    setUnixTimestamp(value);
    if (value === "") {
      setDateValue("");
      return;
    }
    try {
      const timestamp = parseInt(value, 10);
      if (Number.isNaN(timestamp)) throw new Error("Invalid");
      const date = new Date(timestamp * 1000);
      setDateValue(date.toISOString().slice(0, 16));
    } catch {
      setDateValue("Invalid");
    }
  }

  function handleDateChange(value) {
    setDateValue(value);
    if (value === "") {
      setUnixTimestamp("");
      return;
    }
    try {
      const date = new Date(value);
      const timestamp = Math.floor(date.getTime() / 1000);
      setUnixTimestamp(timestamp.toString());
    } catch {
      setUnixTimestamp("Invalid");
    }
  }

  function handleSetNow() {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    setUnixTimestamp(timestamp.toString());
    setDateValue(now.toISOString().slice(0, 16));
  }

  function clearAll() {
    setWei("");
    setGwei("");
    setEth("");
    setHexValue("");
    setDecValue("");
    setUnixTimestamp("");
    setDateValue("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔧 Unit Converter</DialogTitle>
          <DialogDescription>
            Convert between common blockchain units and formats
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wei" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wei">Wei / ETH</TabsTrigger>
            <TabsTrigger value="hex">Hex / Decimal</TabsTrigger>
            <TabsTrigger value="time">Timestamp</TabsTrigger>
          </TabsList>

          {/* Wei/Gwei/ETH Tab */}
          <TabsContent value="wei" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="wei">Wei</Label>
              <Input
                id="wei"
                type="text"
                value={wei}
                onChange={(e) => handleWeiChange(e.target.value)}
                placeholder="1000000000000000000"
                className="font-mono"
              />
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gwei">Gwei</Label>
              <Input
                id="gwei"
                type="text"
                value={gwei}
                onChange={(e) => handleGweiChange(e.target.value)}
                placeholder="1000000000"
                className="font-mono"
              />
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eth">ETH</Label>
              <Input
                id="eth"
                type="text"
                value={eth}
                onChange={(e) => handleEthChange(e.target.value)}
                placeholder="1.0"
                className="font-mono"
              />
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  Conversion Reference:
                </div>
                <div className="space-y-1 font-mono text-xs text-blue-600 dark:text-blue-300">
                  <div>1 ETH = 1,000,000,000 Gwei</div>
                  <div>1 ETH = 1,000,000,000,000,000,000 Wei</div>
                  <div>1 Gwei = 1,000,000,000 Wei</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hex/Decimal Tab */}
          <TabsContent value="hex" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="hex">Hexadecimal</Label>
              <Input
                id="hex"
                type="text"
                value={hexValue}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="0x1a4"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Can start with or without '0x' prefix
              </p>
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal">Decimal</Label>
              <Input
                id="decimal"
                type="text"
                value={decValue}
                onChange={(e) => handleDecChange(e.target.value)}
                placeholder="420"
                className="font-mono"
              />
            </div>

            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
              <CardContent className="pt-4">
                <div className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                  Common Use Cases:
                </div>
                <div className="space-y-1 text-xs text-purple-600 dark:text-purple-300">
                  <div>• Block numbers (decimal to hex for JSON-RPC)</div>
                  <div>• Token amounts in contract calls</div>
                  <div>• Gas limits and prices</div>
                  <div>• Method IDs and function selectors</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timestamp Tab */}
          <TabsContent value="time" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="unix">Unix Timestamp (seconds)</Label>
              <Input
                id="unix"
                type="text"
                value={unixTimestamp}
                onChange={(e) => handleUnixChange(e.target.value)}
                placeholder="1704067200"
                className="font-mono"
              />
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={dateValue}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSetNow}
              variant="secondary"
              className="w-full"
            >
              📅 Set to Current Time
            </Button>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardContent className="pt-4">
                <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  Block Timestamps:
                </div>
                <div className="space-y-1 text-xs text-green-600 dark:text-green-300">
                  <div>
                    • Block timestamps are in Unix time (seconds since 1970)
                  </div>
                  <div>• Useful for testing time-based contract logic</div>
                  <div>• Anvil can manipulate block timestamps</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button onClick={clearAll} variant="outline">
            Clear All
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
