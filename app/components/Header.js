"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookmarksPanel from "./BookmarksPanel";
import FoundryProjectManager from "./FoundryProjectManager";
import EventStreamManager from "./EventStreamManager";
import ForgeTestRunner from "./ForgeTestRunner";
import AnvilStateManager from "./AnvilStateManager";
import UnitConverter from "./UnitConverter";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [search, setSearch] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const query = search.trim();

    // Check if it's a block number
    if (/^\d+$/.test(query)) {
      router.push(`/block/${query}`);
      return;
    }

    // Check if it's a transaction hash (0x + 64 hex chars)
    if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
      router.push(`/tx/${query}`);
      return;
    }

    // Check if it's an address (0x + 40 hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
      router.push(`/address/${query}`);
      return;
    }

    alert(
      "Invalid input. Please enter a block number, transaction hash, or address.",
    );
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🔥</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              FurnaceScout
            </h1>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Address / Tx Hash / Block"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </form>

          <nav className="flex items-center gap-4">
            <Link
              href="/events"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/dashboard"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/deployments"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              Deployments
            </Link>
            <Link
              href="/cast-builder"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              Cast Builder
            </Link>
            <Link
              href="/labels"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              🏷️ Labels
            </Link>
            <Link
              href="/stats"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              📊 Stats
            </Link>
            <Link
              href="/gas"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              ⛽ Gas
            </Link>
            <Link
              href="/search"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              🔍 Search
            </Link>
            <Link
              href="/tokens"
              className="text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors"
            >
              🪙 Tokens
            </Link>
            <FoundryProjectManager />
            <EventStreamManager />
            <ForgeTestRunner />
            <AnvilStateManager />
            <button
              onClick={() => setShowConverter(true)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-semibold"
              title="Unit Converter"
            >
              🔧 Converter
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShowBookmarks(true)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-semibold"
              title="View bookmarks"
            >
              📌 Bookmarks
            </button>
            <Link
              href="/upload-abi"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
            >
              Upload ABI
            </Link>
          </nav>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-zinc-700 dark:text-zinc-300">
              Connected to Anvil (localhost:8545)
            </span>
          </div>
        </div>
      </div>

      {/* Unit Converter */}
      <UnitConverter
        isOpen={showConverter}
        onClose={() => setShowConverter(false)}
      />

      {/* Bookmarks Panel */}
      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />
    </header>
  );
}
