import EventStreamManager from "@/app/components/EventStreamManager";

export const metadata = {
  title: "Event Stream Manager - FurnaceScout",
  description: "Subscribe to and monitor contract events live",
};

export default function EventStreamPage() {
  return <EventStreamManager />;
}
