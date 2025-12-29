"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { foundry } from "wagmi/chains";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

const config = createConfig({
  chains: [foundry],
  transports: {
    [foundry.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
    ),
  },
});

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="furnacescout_theme"
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
