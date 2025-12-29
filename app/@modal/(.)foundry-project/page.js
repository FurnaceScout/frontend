import FoundryProjectManager from "@/app/components/FoundryProjectManager";
import Modal from "@/app/components/Modal";

export default function InterceptedFoundryProjectPage() {
  return (
    <Modal title="🏗️ Foundry Project Manager">
      <FoundryProjectManager />
    </Modal>
  );
}
