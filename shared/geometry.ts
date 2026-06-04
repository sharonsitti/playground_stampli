export const SHIP_SIZES: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

export function getOccupiedCells(ship: {
  type: string;
  orientation: "H" | "V";
  origin_col: number;
  origin_row: number;
}): Array<{ col: number; row: number }> {
  const size = SHIP_SIZES[ship.type];
  if (size === undefined) {
    throw new Error(`Unknown ship type: ${ship.type}`);
  }

  const cells: Array<{ col: number; row: number }> = [];
  for (let i = 0; i < size; i++) {
    if (ship.orientation === "H") {
      cells.push({ col: ship.origin_col + i, row: ship.origin_row });
    } else {
      cells.push({ col: ship.origin_col, row: ship.origin_row + i });
    }
  }
  return cells;
}
