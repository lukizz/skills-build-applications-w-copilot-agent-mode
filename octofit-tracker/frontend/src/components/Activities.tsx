import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadActivities = () => getJson<Record<string, unknown>>('/api/activities');

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      load={loadActivities}
      resultKey="activities"
      emptyText="No activities found."
      renderItem={(activity) => `${String(activity.type)} — ${String(activity.minutes)} minutes, ${String(activity.points)} points`}
    />
  );
}
