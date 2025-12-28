import DeploymentTracker from "@/app/components/DeploymentTracker";

export const metadata = {
  title: "Foundry Deployments - IronScout",
  description: "Track and manage Foundry contract deployments",
};

export default function DeploymentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DeploymentTracker defaultChainId="31337" />
    </div>
  );
}
