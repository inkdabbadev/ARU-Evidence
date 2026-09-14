export const evidencePieces = [
  {id:1,label:'The Examination',color:'#d2ab57'}, {id:2,label:'Higginbothams',color:'#987eaf'},
  {id:3,label:'Connections',color:'#b86661'}, {id:4,label:'Little Things',color:'#739c83'},
  {id:5,label:'Later',color:'#b09163'}, {id:6,label:'Do Nothing',color:'#809ca7'},
];
export function normalizeEvidence(ids: unknown, legacyCount: unknown = 0): number[] {
  if(Array.isArray(ids)) return [...new Set(ids.filter((id): id is number => evidencePieces.some(p => p.id === id)))];
  const count = typeof legacyCount === 'number' && Number.isFinite(legacyCount) ? Math.max(0,Math.min(6,Math.floor(legacyCount))) : 0;
  return evidencePieces.slice(0,count).map(p => p.id);
}
export function collectEvidence(ids: number[], id: number): number[] {
  return ids.includes(id) || !evidencePieces.some(p => p.id === id) ? ids : [...ids,id];
}
