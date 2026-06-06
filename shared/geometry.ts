export type ShipDef = {
  type: "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";
  orientation: "H" | "V";
  origin_col: number; // 0-9
  origin_row: number; // 1-10
};

export const SHIP_SIZES: Record<ShipDef["type"], number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

// H: extends toward higher col indices. V: extends toward higher row indices.
export function getOccupiedCells(
  ship: ShipDef,
): Array<{ col: number; row: number }> {
  const size = SHIP_SIZES[ship.type];
  const cells: Array<{ col: number; row: number }> = [];
  for (let i = 0; i < size; i++) {
    cells.push(
      ship.orientation === "H"
        ? { col: ship.origin_col + i, row: ship.origin_row }
        : { col: ship.origin_col, row: ship.origin_row + i },
    );
  }
  return cells;
}
