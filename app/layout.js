import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FurnaceScout - Anvil Block Explorer",
  description:
    "Unofficial frontend block explorer for Foundry's Anvil testnet. Not affiliated with or supported by the Foundry team.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                <p className="mb-2">
                  <strong>⚠️ Unofficial Project</strong> - FurnaceScout is a
                  community-built tool, not affiliated with or supported by the
                  Foundry team.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  For official Foundry support, visit{" "}
                  <a
                    href="https://book.getfoundry.sh/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    book.getfoundry.sh
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://github.com/foundry-rs/foundry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    github.com/foundry-rs/foundry
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
