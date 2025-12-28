"use client";

import { useState, useEffect } from "react";
import { saveABI, getAllABIs } from "@/lib/abi-store";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        Upload Contract ABI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Add New ABI
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Contract Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Contract Name (Optional)
              </label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="MyContract"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Upload Method Tabs */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Upload Method
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod("file")}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                    uploadMethod === "file"
                      ? "bg-red-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  📁 Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("paste")}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                    uploadMethod === "paste"
                      ? "bg-red-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  📝 Paste JSON
                </button>
              </div>

              {uploadMethod === "file" ? (
                <div>
                  <div className="mb-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="abi-file-input"
                    />
                    <label
                      htmlFor="abi-file-input"
                      className="block w-full px-4 py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center cursor-pointer hover:border-red-500 transition-colors"
                    >
                      <div className="text-4xl mb-2">📄</div>
                      <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {fileName ? fileName : "Click to upload JSON file"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Supports Foundry output (out/*.json) or raw ABI
                      </div>
                    </label>
                  </div>

                  {abiText && (
                    <div className="mt-3">
                      <div className="text-xs text-zinc-500 mb-1">
                        Parsed ABI Preview:
                      </div>
                      <div className="max-h-32 overflow-y-auto bg-zinc-50 dark:bg-zinc-800 p-2 rounded font-mono text-xs">
                        {abiText.slice(0, 200)}...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400">
                      ABI JSON *
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadExample}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Load Example
                    </button>
                  </div>
                  <textarea
                    value={abiText}
                    onChange={(e) => setAbiText(e.target.value)}
                    placeholder='[{"type":"function","name":"transfer",...}]'
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    rows={12}
                    required
                  />
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded text-sm">
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
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
                ✓ ABI saved successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={!abiText || !address}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
            >
              Upload ABI
            </button>
          </form>
        </div>

        {/* Saved ABIs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Saved ABIs ({Object.keys(savedABIs).length})
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {Object.entries(savedABIs).length > 0 ? (
              Object.entries(savedABIs).map(([addr, data]) => (
                <Link
                  key={addr}
                  href={`/address/${addr}`}
                  className="block p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {data.name || "Unnamed Contract"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {
                        data.abi.filter((item) => item.type === "function")
                          .length
                      }{" "}
                      functions
                    </div>
                  </div>
                  <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all">
                    {addr}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Saved {new Date(data.timestamp).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <div className="text-4xl mb-2">📋</div>
                <div className="font-semibold mb-1">No saved ABIs yet</div>
                <div className="text-xs">
                  Upload your first contract ABI to get started
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
