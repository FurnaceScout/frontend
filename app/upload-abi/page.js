"use client";

import { useState, useEffect } from "react";
import { saveABI, getAllABIs } from "@/lib/abi-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";

export default function UploadABIPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [abiText, setAbiText] = useState("");
  const [contractName, setContractName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedABIs, setSavedABIs] = useState({});
  const [uploadMethod, setUploadMethod] = useState("file"); // 'file' or 'paste'
  const [fileName, setFileName] = useState("");

  // Load saved ABIs on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSavedABIs(getAllABIs());
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Check if it's a Foundry output format (has 'abi' field)
      if (json.abi && Array.isArray(json.abi)) {
        // Foundry format: { abi: [...], bytecode: {...}, ... }
        setAbiText(JSON.stringify(json.abi, null, 2));

        // Try to extract contract name from filename
        // e.g., "Counter.sol/Counter.json" -> "Counter"
        const nameMatch = file.name.match(/([^/]+)\.json$/);
        if (nameMatch && !contractName) {
          setContractName(nameMatch[1]);
        }
      } else if (Array.isArray(json)) {
        // Direct ABI array format
        setAbiText(JSON.stringify(json, null, 2));
      } else {
        setError("Invalid JSON format. Expected Foundry output or ABI array.");
      }
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate address
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid Ethereum address format");
      return;
    }

    // Validate and parse ABI
    let parsedABI;
    try {
      parsedABI = JSON.parse(abiText);

      // Check if it's an array
      if (!Array.isArray(parsedABI)) {
        setError("ABI must be a JSON array");
        return;
      }

      // Basic validation
      if (parsedABI.length === 0) {
        setError("ABI cannot be empty");
        return;
      }
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
      return;
    }

    // Save ABI
    try {
      saveABI(address, parsedABI, contractName);
      setSuccess(true);

      // Refresh saved ABIs
      setSavedABIs(getAllABIs());

      // Reset form
      setTimeout(() => {
        setAddress("");
        setAbiText("");
        setContractName("");
        setFileName("");
        setSuccess(false);
      }, 2000);
    } catch (e) {
      setError(`Failed to save ABI: ${e.message}`);
    }
  };

  const handleLoadExample = () => {
    const exampleABI = [
      {
        inputs: [],
        name: "count",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "increment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    setAbiText(JSON.stringify(exampleABI, null, 2));
    setContractName("Counter");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Contract ABI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New ABI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Contract Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-name">Contract Name (Optional)</Label>
                <Input
                  id="contract-name"
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="MyContract"
                />
              </div>

              {/* Upload Method Tabs */}
              <div className="space-y-2">
                <Label>Upload Method</Label>
                <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">📁 Upload File</TabsTrigger>
                    <TabsTrigger value="paste">📝 Paste JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="abi-file-input"
                      />
                      <label
                        htmlFor="abi-file-input"
                        className="block w-full px-4 py-8 border-2 border-dashed border-input rounded-lg text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <div className="text-4xl mb-2">📄</div>
                        <div className="font-semibold mb-1">
                          {fileName ? fileName : "Click to upload JSON file"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Supports Foundry output (out/*.json) or raw ABI
                        </div>
                      </label>
                    </div>

                    {abiText && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Parsed ABI Preview:
                        </div>
                        <div className="max-h-32 overflow-y-auto bg-muted p-2 rounded font-mono text-xs">
                          {abiText.slice(0, 200)}...
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="abi-json"
                          className="text-sm text-muted-foreground"
                        >
                          ABI JSON *
                        </Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={handleLoadExample}
                          className="h-auto p-0 text-xs"
                        >
                          Load Example
                        </Button>
                      </div>
                      <textarea
                        id="abi-json"
                        value={abiText}
                        onChange={(e) => setAbiText(e.target.value)}
                        placeholder='[{"type":"function","name":"transfer",...}]'
                        className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-xs min-h-[200px] resize-y"
                        required
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  💡 Tip: Using Foundry?
                </div>
                <div className="text-blue-600 dark:text-blue-300 text-xs">
                  Upload the JSON file from{" "}
                  <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                    out/YourContract.sol/YourContract.json
                  </code>{" "}
                  directly! The ABI will be automatically extracted.
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                  ✓ ABI saved successfully!
                </div>
              )}

              <Button
                type="submit"
                disabled={!abiText || !address}
                className="w-full"
              >
                Upload ABI
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Saved ABIs */}
        <Card>
          <CardHeader>
            <CardTitle>
              Saved ABIs{" "}
              <Badge variant="secondary" className="ml-2">
                {Object.keys(savedABIs).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {Object.entries(savedABIs).length > 0 ? (
                Object.entries(savedABIs).map(([addr, data]) => (
                  <Link
                    key={addr}
                    href={`/address/${addr}`}
                    className="block p-4 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {data.name || "Unnamed Contract"}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {
                          data.abi.filter((item) => item.type === "function")
                            .length
                        }{" "}
                        functions
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground break-all">
                      {addr}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Saved {new Date(data.timestamp).toLocaleDateString()}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">📋</div>
                  <div className="font-semibold mb-1">No saved ABIs yet</div>
                  <div className="text-xs">
                    Upload your first contract ABI to get started
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
