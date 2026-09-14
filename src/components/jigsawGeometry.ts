export const PUZZLE_WIDTH = 600;
export const PUZZLE_HEIGHT = 400;
export type Point = { x: number; y: number };
export type PuzzlePiece = { index: number; x: number; y: number; width: number; height: number; path: string; edge: boolean; neighbours: number[] };
export type PieceGroup = { id: number; pieces: number[]; x: number; y: number };
export type TableSize = { width: number; height: number };

function edge(a: Point, b: Point, depth: number) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const p = (t: number, offset = 0) => `${a.x + dx * t - dy / length * offset},${a.y + dy * t + dx / length * offset}`;
  if (!depth) return `L${p(1)}`;
  return `L${p(.36)} C${p(.43)} ${p(.39, depth * .4)} ${p(.39, depth * .65)} C${p(.39, depth * 1.2)} ${p(.61, depth * 1.2)} ${p(.61, depth * .65)} C${p(.61, depth * .4)} ${p(.57)} ${p(.64)} L${p(1)}`;
}

export function makePieces(columns = 6, rows = 4): PuzzlePiece[] {
  const width = PUZZLE_WIDTH / columns, height = PUZZLE_HEIGHT / rows;
  const tab = Math.min(width, height) * .19;
  return Array.from({ length: columns * rows }, (_, index) => {
    const col = index % columns, row = Math.floor(index / columns), x = col * width, y = row * height;
    const tl = { x, y }, tr = { x: x + width, y }, br = { x: x + width, y: y + height }, bl = { x, y: y + height };
    const horizontal = (r: number, c: number) => (r + c) % 2 ? -tab : tab;
    const vertical = (r: number, c: number) => (r + c) % 2 ? -tab : tab;
    return { index, x, y, width, height, edge: col === 0 || col === columns - 1 || row === 0 || row === rows - 1,
      neighbours: [col > 0 ? index - 1 : -1, col < columns - 1 ? index + 1 : -1, row > 0 ? index - columns : -1, row < rows - 1 ? index + columns : -1].filter(n => n >= 0),
      path: `M${x},${y} ${edge(tl, tr, row === 0 ? 0 : horizontal(row - 1, col))} ${edge(tr, br, col === columns - 1 ? 0 : vertical(row, col))} ${edge(br, bl, row === rows - 1 ? 0 : -horizontal(row, col))} ${edge(bl, tl, col === 0 ? 0 : -vertical(row, col - 1))} Z` };
  });
}

export function groupBounds(group: PieceGroup, pieces: PuzzlePiece[]) {
  const members = group.pieces.map(index => pieces[index]);
  return { left: Math.min(...members.map(p => p.x)) - 22, top: Math.min(...members.map(p => p.y)) - 22,
    right: Math.max(...members.map(p => p.x + p.width)) + 22, bottom: Math.max(...members.map(p => p.y + p.height)) + 22 };
}

export function clampGroup(group: PieceGroup, pieces: PuzzlePiece[], size: TableSize): PieceGroup {
  const b = groupBounds(group, pieces);
  return { ...group, x: Math.max(-b.left, Math.min(size.width - b.right, group.x)), y: Math.max(-b.top, Math.min(size.height - b.bottom, group.y)) };
}

export function scatterPieces(pieces: PuzzlePiece[], size: TableSize): PieceGroup[] {
  const order = pieces.map(p => p.index);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const columns = size.width < 900 ? 4 : 6;
  const rows = Math.ceil(pieces.length / columns);
  return order.map((index, i) => {
    const piece = pieces[index];
    return clampGroup({ id: index, pieces: [index], x: (i % columns + .5) * size.width / columns - piece.x - piece.width / 2 + (Math.random() - .5) * 22,
      y: (Math.floor(i / columns) + .5) * size.height / rows - piece.y - piece.height / 2 + (Math.random() - .5) * 22 }, pieces, size);
  });
}

export function joinGroups(groups: PieceGroup[], movingId: number, pieces: PuzzlePiece[], tolerance = 25) {
  let moving = groups.find(g => g.id === movingId);
  if (!moving) return { groups, joined: 0 };
  let rest = groups.filter(g => g.id !== movingId);
  let joined = 0;
  while (true) {
    const neighbours: Set<number> = new Set(moving.pieces.flatMap(index => pieces[index].neighbours));
    const match: PieceGroup | undefined = rest.filter(g => g.pieces.some(index => neighbours.has(index)) && Math.hypot(g.x - moving!.x, g.y - moving!.y) <= tolerance)
      .sort((a, b) => Math.hypot(a.x - moving!.x, a.y - moving!.y) - Math.hypot(b.x - moving!.x, b.y - moving!.y))[0];
    if (!match) break;
    moving = { ...moving, x: match.x, y: match.y, pieces: [...moving.pieces, ...match.pieces] };
    rest = rest.filter(g => g.id !== match.id);
    joined++;
  }
  return { groups: [...rest, moving], joined };
}
