// Simple in-memory store for ABIs (in production, use a database)
const abiStore = new Map();
const sourceStore = new Map();

export function saveABI(address, abi, name = "") {
  const normalized = address.toLowerCase();
  abiStore.set(normalized, {
    abi: JSON.parse(typeof abi === "string" ? abi : JSON.stringify(abi)),
    name,
    timestamp: Date.now(),
  });

  // Also save to localStorage in browser
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem("furnacescout_abis") || "{}",
      );
      stored[normalized] = {
        abi: JSON.parse(typeof abi === "string" ? abi : JSON.stringify(abi)),
        name,
        timestamp: Date.now(),
      };
      localStorage.setItem("furnacescout_abis", JSON.stringify(stored));
    } catch (e) {
      console.error("Failed to save ABI to localStorage:", e);
    }
  }

  return true;
}

export function getABI(address) {
  const normalized = address.toLowerCase();

  // Check memory first
  let data = abiStore.get(normalized);
  if (data) return data;

  // Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem("furnacescout_abis") || "{}",
      );
      data = stored[normalized];
      if (data) {
        // Populate memory store
        abiStore.set(normalized, data);
        return data;
      }
    } catch (e) {
      console.error("Failed to load ABI from localStorage:", e);
    }
  }

  return null;
}

export function getAllABIs() {
  // Merge memory and localStorage
  const all = new Map(abiStore);

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem("furnacescout_abis") || "{}",
      );
      for (const [addr, data] of Object.entries(stored)) {
        if (!all.has(addr)) {
          all.set(addr, data);
        }
      }
    } catch (e) {
      console.error("Failed to load ABIs from localStorage:", e);
    }
  }

  return Object.fromEntries(all);
}

export function saveSourceCode(address, sourceCode, fileName = "") {
  const normalized = address.toLowerCase();
  sourceStore.set(normalized, {
    sourceCode,
    fileName,
    timestamp: Date.now(),
  });

  // Save to localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem("furnacescout_sources") || "{}",
      );
      stored[normalized] = {
        sourceCode,
        fileName,
        timestamp: Date.now(),
      };
      localStorage.setItem("furnacescout_sources", JSON.stringify(stored));
    } catch (e) {
      console.error("Failed to save source code to localStorage:", e);
    }
  }

  return true;
}

export function getSourceCode(address) {
  const normalized = address.toLowerCase();

  // Check memory first
  let data = sourceStore.get(normalized);
  if (data) return data;

  // Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem("furnacescout_sources") || "{}",
      );
      data = stored[normalized];
      if (data) {
        sourceStore.set(normalized, data);
        return data;
      }
    } catch (e) {
      console.error("Failed to load source code from localStorage:", e);
    }
  }

  return null;
}
