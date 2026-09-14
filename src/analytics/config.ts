// Reorder the route here; room IDs remain the existing game's navigation IDs.
export const stations = [
  { id: 'intro', label: 'Arrival' }, { id: 'piece1', label: 'The Examination', puzzle: 'examination' },
  { id: 'piece2', label: 'Higginbothams' }, { id: 'piece3', label: 'Connections', puzzle: 'connections' },
  { id: 'piece4', label: 'Little Things', puzzle: 'memory' }, { id: 'piece5', label: 'Later' },
  { id: 'piece6', label: 'Do Nothing' }, { id: 'final-puzzle', label: 'Final Puzzle', puzzle: 'final' },
  { id: 'final-room', label: 'The Letter' }, { id: 'complete', label: 'Case Closed' },
];
export const IDLE_MS = 60_000;
export const HEARTBEAT_MS = 30_000;
export const DISCONNECTED_MS = 90_000;
export const SESSION_EXPIRY_MS = 30 * 60_000;
export const stationLabel = (id: string | null) => stations.find(s => s.id === id)?.label ?? 'Not entered';
