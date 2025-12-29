import AnvilStateManager from "@/app/components/AnvilStateManager";
import Modal from "@/app/components/Modal";

export default function InterceptedAnvilStatePage() {
  return (
    <Modal title="⚙️ Anvil State Management">
      <AnvilStateManager />
    </Modal>
  );
}
