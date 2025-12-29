import EventStreamManager from "@/app/components/EventStreamManager";
import Modal from "@/app/components/Modal";

export default function InterceptedEventStreamPage() {
  return (
    <Modal title="📡 Event Stream Manager">
      <EventStreamManager />
    </Modal>
  );
}
