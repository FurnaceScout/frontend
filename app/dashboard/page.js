"use client";

import Link from "next/link";
import { useState } from "react";
import AnvilStatus from "@/app/components/AnvilStatus";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function DashboardPage() {
  const [anvilExpanded, setAnvilExpanded] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Developer Tips */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💡</span> Developer Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <TipItem>
                <strong>Quick Deploy:</strong> Use{" "}
                <Badge variant="secondary" className="font-mono text-xs">
                  forge create
                </Badge>{" "}
                with test account #0 private key for instant deployments
              </TipItem>
              <TipItem>
                <strong>Fast Testing:</strong> Anvil mines blocks instantly - no
                waiting for confirmations!
              </TipItem>
              <TipItem>
                <strong>Reset State:</strong> Restart Anvil anytime to reset
                blockchain state
              </TipItem>
              <TipItem>
                <strong>ABI Upload:</strong> Drag & drop contract JSON files
                from{" "}
                <Badge variant="secondary" className="font-mono text-xs">
                  out/
                </Badge>{" "}
                folder
              </TipItem>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl">{icon}</div>
          <Badge variant="outline" className="text-xs">
            {description}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, label, description, external = false }) {
  const content = (
    <>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 border rounded-lg hover:border-primary transition-colors text-center"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="block p-4 border rounded-lg hover:border-primary transition-colors text-center"
    >
      {content}
    </Link>
  );
}

function TipItem({ children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary mt-0.5">→</span>
      <div>{children}</div>
    </div>
  );
}
