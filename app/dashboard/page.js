'use client';

import { useState } from 'react';
import AnvilStatus from '@/app/components/AnvilStatus';

export default function DashboardPage() {
  const [anvilExpanded, setAnvilExpanded] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Monitor your Anvil testnet and development environment
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Anvil Status */}
        <AnvilStatus
          expanded={anvilExpanded}
          onToggle={() => setAnvilExpanded(!anvilExpanded)}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Test Accounts"
            value="10"
            icon="👥"
            description="Anvil default accounts"
          />
          <StatCard
            title="Total Balance"
            value="100,000 ETH"
            icon="💰"
            description="Across all accounts"
          />
          <StatCard
            title="Network"
            value="Anvil Local"
            icon="🔥"
            description="Chain ID: 31337"
          />
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Quick Links
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLink
              href="/"
              icon="🏠"
              label="Home"
              description="Latest blocks"
            />
            <QuickLink
              href="/upload-abi"
              icon="📤"
              label="Upload ABI"
              description="Add contract"
            />
            <QuickLink
              href="/events"
              icon="📋"
              label="Events"
              description="View logs"
            />
            <QuickLink
              href="https://book.getfoundry.sh"
              icon="📖"
              label="Foundry Docs"
              description="External"
              external
            />
          </div>
        </div>

        {/* Developer Tips */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>💡</span> Developer Tips
          </h2>
          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <TipItem>
              <strong>Quick Deploy:</strong> Use{' '}
              <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">
                forge create
              </code>{' '}
              with test account #0 private key for instant deployments
            </TipItem>
            <TipItem>
              <strong>Fast Testing:</strong> Anvil mines blocks instantly - no waiting for confirmations!
            </TipItem>
            <TipItem>
              <strong>Reset State:</strong> Restart Anvil anytime to reset blockchain state
            </TipItem>
            <TipItem>
              <strong>ABI Upload:</strong> Drag & drop contract JSON files from{' '}
              <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">
                out/
              </code>{' '}
              folder
            </TipItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{title}</div>
    </div>
  );
}

function QuickLink({ href, icon, label, description, external = false }) {
  const baseClasses = "block p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 transition-colors text-center";

  const content = (
    <>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        {label}
      </div>
      <div className="text-xs text-zinc-500">{description}</div>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <a href={href} className={baseClasses}>
      {content}
    </a>
  );
}

function TipItem({ children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-red-500 mt-0.5">→</span>
      <div>{children}</div>
    </div>
  );
}
