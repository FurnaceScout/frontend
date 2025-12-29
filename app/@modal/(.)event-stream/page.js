import Modal from "@/app/components/Modal";
import EventStreamManager from "@/app/components/EventStreamManager";

export default function InterceptedEventStreamPage() {
  return (
    <Modal title="📡 Event Stream Manager">
      <EventStreamManager />
    </Modal>
  );
}
