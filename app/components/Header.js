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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/app/components/ui/navigation-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Header() {
  const [search, setSearch] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
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

    toast.error(
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
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Address / Tx Hash / Block"
              className="w-full"
            />
          </form>

          <nav className="flex items-center gap-2">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Explore Group */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <ListItem href="/search" title="🔍 Search">
                        Search and filter blockchain data by multiple criteria
                      </ListItem>
                      <ListItem href="/dashboard" title="Dashboard">
                        Overview of recent blocks, transactions, and activity
                      </ListItem>
                      <ListItem href="/tokens" title="🪙 Tokens">
                        Browse all ERC20, ERC721, and ERC1155 tokens
                      </ListItem>
                      <ListItem href="/events" title="Events">
                        Monitor and decode contract events in real-time
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Analytics Group */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <ListItem href="/stats" title="📊 Stats">
                        Network statistics, charts, and historical data
                      </ListItem>
                      <ListItem href="/gas" title="⛽ Gas">
                        Gas price analytics and transaction cost insights
                      </ListItem>
                      <ListItem href="/labels" title="🏷️ Labels">
                        Manage custom address labels and tags
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Developer Tools Group */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Dev Tools</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                      <ListItem href="/cast-builder" title="Cast Builder">
                        Build and execute cast commands with a visual interface
                      </ListItem>
                      <ListItem href="/upload-abi" title="Upload ABI">
                        Upload contract ABIs to enable interaction and decoding
                      </ListItem>
                      <ListItem href="/deployments" title="Deployments">
                        Track and manage your contract deployments
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Foundry Tools Group */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Foundry</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <li>
                        <button
                          onClick={() => {
                            const projectBtn = document.querySelector(
                              "[data-foundry-project]",
                            );
                            if (projectBtn) projectBtn.click();
                          }}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                        >
                          <div className="text-sm font-medium leading-none">
                            🏗️ Project Manager
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Scan and manage your Foundry project contracts
                          </p>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            const testBtn =
                              document.querySelector("[data-forge-test]");
                            if (testBtn) testBtn.click();
                          }}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                        >
                          <div className="text-sm font-medium leading-none">
                            🧪 Test Runner
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Run and manage Forge tests with detailed results
                          </p>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            const eventsBtn = document.querySelector(
                              "[data-event-stream]",
                            );
                            if (eventsBtn) eventsBtn.click();
                          }}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                        >
                          <div className="text-sm font-medium leading-none">
                            📡 Event Stream
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Subscribe to and monitor contract events live
                          </p>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            const anvilBtn =
                              document.querySelector("[data-anvil-state]");
                            if (anvilBtn) anvilBtn.click();
                          }}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                        >
                          <div className="text-sm font-medium leading-none">
                            ⚙️ Anvil State
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Manage snapshots, mining, and blockchain state
                          </p>
                        </button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Hidden trigger buttons for Foundry tools */}
            <div className="hidden">
              <div data-foundry-project="true">
                <FoundryProjectManager />
              </div>
              <div data-forge-test="true">
                <ForgeTestRunner />
              </div>
              <div data-event-stream="true">
                <EventStreamManager />
              </div>
              <div data-anvil-state="true">
                <AnvilStateManager />
              </div>
            </div>

            {/* Utility Actions */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                onClick={() => setShowConverter(true)}
                variant="ghost"
                size="sm"
                title="Unit Converter"
              >
                🔧
              </Button>
              <Button
                onClick={() => setShowThemeSelector(true)}
                variant="ghost"
                size="sm"
                title="Change theme"
              >
                🎨
              </Button>
              <Button
                onClick={() => setShowBookmarks(true)}
                variant="ghost"
                size="sm"
                title="View bookmarks"
              >
                📌
              </Button>
            </div>
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

      {/* Theme Selector */}
      <ThemeToggle
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {/* Bookmarks Panel */}
      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />
    </header>
  );
}

// ListItem component for navigation menu items
const ListItem = ({ className, title, children, href, ...props }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
