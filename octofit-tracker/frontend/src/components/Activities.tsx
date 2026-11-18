import { CapabilityCard } from './CapabilityCard.js';
export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      resultKey="activities"
      emptyText="No activities found."
      renderItem={(activity) => `${String(activity.type)} — ${String(activity.minutes)} minutes, ${String(activity.points)} points`}
    />
  );
}
