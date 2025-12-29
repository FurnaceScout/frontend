import AnvilStateManager from "@/app/components/AnvilStateManager";

export const metadata = {
  title: "Anvil State Manager - FurnaceScout",
  description:
    "Manage Anvil blockchain state: snapshots, mining, time, and accounts",
};

export default function AnvilStatePage() {
  return <AnvilStateManager />;
}
