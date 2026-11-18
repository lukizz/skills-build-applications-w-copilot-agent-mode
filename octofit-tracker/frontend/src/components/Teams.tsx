import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      resultKey="teams"
      emptyText="No teams found."
      renderItem={(team) => {
        const members = Array.isArray(team.members) ? team.members.join(', ') : '';
        return `${String(team.name)}${members ? ` — ${members}` : ''}`;
      }}
    />
  );
}
