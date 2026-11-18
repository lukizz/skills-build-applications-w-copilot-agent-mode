import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadWorkoutSuggestions = () => getJson<Record<string, unknown>>('/api/workouts/suggestions/mona%40example.com');

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      load={loadWorkoutSuggestions}
      resultKey="suggestions"
      emptyText="No workout suggestions found."
      renderItem={(suggestion) => `${String(suggestion.title)} — ${String(suggestion.reason ?? '')}`}
    />
  );
}
