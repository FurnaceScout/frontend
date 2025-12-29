import Modal from "@/app/components/Modal";
import AnvilStateManager from "@/app/components/AnvilStateManager";

export default function InterceptedAnvilStatePage() {
  return (
    <Modal title="⚙️ Anvil State Management">
      <AnvilStateManager />
    </Modal>
  );
}
