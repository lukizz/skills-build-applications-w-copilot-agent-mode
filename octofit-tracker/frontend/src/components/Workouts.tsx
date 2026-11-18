import { CapabilityCard } from './CapabilityCard.js';
export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path="/api/workouts/suggestions/mona%40example.com"
      resultKey="suggestions"
      emptyText="No workout suggestions found."
      renderItem={(suggestion) => `${String(suggestion.title)} — ${String(suggestion.reason ?? '')}`}
    />
  );
}
