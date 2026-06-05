import { SHIP_SIZES } from "./schemas";

export function getOccupiedCells(ship: {
  type: string;
  orientation: "H" | "V";
  origin_col: number;
  origin_row: number;
}): Array<{ col: number; row: number }> {
  const size = SHIP_SIZES[ship.type];
  const cells: Array<{ col: number; row: number }> = [];
  for (let i = 0; i < size; i++) {
    cells.push({
      col: ship.orientation === "H" ? ship.origin_col + i : ship.origin_col,
      row: ship.orientation === "V" ? ship.origin_row + i : ship.origin_row,
    });
  }
  return cells;
}
