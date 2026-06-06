import { z } from "zod";

export const PRESET_SECONDS: Record<"quick" | "casual", number> = {
  quick: 30,
  casual: 60,
};

export const CreatePlayerRequest = z.object({
  name: z.string().trim().min(1).max(50),
});
export type CreatePlayerRequest = z.infer<typeof CreatePlayerRequest>;

export const PlayerResponse = z.object({
  id: z.string(),
  name: z.string(),
  games_played: z.number(),
  wins: z.number(),
  losses: z.number(),
  win_rate: z.number(),
});
export type PlayerResponse = z.infer<typeof PlayerResponse>;

const Preset = z.enum(["quick", "casual"]);

export const CreateGameRequest = z.object({
  creator_id: z.string(),
  preset: Preset,
});
export type CreateGameRequest = z.infer<typeof CreateGameRequest>;

export const CreateGameResponse = z.object({
  id: z.string(),
  preset: Preset,
  status: z.literal("waiting"),
  creator_id: z.string(),
});
export type CreateGameResponse = z.infer<typeof CreateGameResponse>;

export const JoinGameRequest = z.object({
  player_id: z.string(),
});
export type JoinGameRequest = z.infer<typeof JoinGameRequest>;

export const JoinGameResponse = z.object({
  id: z.string(),
  preset: Preset,
  status: z.literal("placing"),
  creator_id: z.string(),
  joiner_id: z.string(),
});
export type JoinGameResponse = z.infer<typeof JoinGameResponse>;

export const DeleteGameRequest = z.object({
  player_id: z.string(),
});
export type DeleteGameRequest = z.infer<typeof DeleteGameRequest>;

export const DeleteGameResponse = z.object({
  ok: z.literal(true),
});
export type DeleteGameResponse = z.infer<typeof DeleteGameResponse>;

export const GetGamesResponse = z.object({
  games: z.array(
    z.object({
      id: z.string(),
      preset: Preset,
      creator: PlayerResponse,
    }),
  ),
});
export type GetGamesResponse = z.infer<typeof GetGamesResponse>;

export const GameCreatedEvent = z.object({
  id: z.string(),
  preset: Preset,
  creator: PlayerResponse,
});
export type GameCreatedEvent = z.infer<typeof GameCreatedEvent>;

export const GameRemovedEvent = z.object({
  id: z.string(),
});
export type GameRemovedEvent = z.infer<typeof GameRemovedEvent>;

export const PlayerJoinedEvent = z.object({
  joiner: z.object({
    id: z.string(),
    name: z.string(),
  }),
  timer_seconds: z.number(),
});
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEvent>;

const ShipType = z.enum([
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer",
]);
const Orientation = z.enum(["H", "V"]);

export const PlaceShipsRequest = z.object({
  player_id: z.string(),
  ships: z.array(
    z.object({
      type: ShipType,
      orientation: Orientation,
      origin_col: z.number().int(),
      origin_row: z.number().int(),
    }),
  ),
});
export type PlaceShipsRequest = z.infer<typeof PlaceShipsRequest>;

export const ReadyRequest = z.object({
  player_id: z.string(),
});
export type ReadyRequest = z.infer<typeof ReadyRequest>;

export const OkResponse = z.object({
  ok: z.literal(true),
});
export type OkResponse = z.infer<typeof OkResponse>;

export const TimerTickEvent = z.object({
  seconds_remaining: z.number(),
});
export type TimerTickEvent = z.infer<typeof TimerTickEvent>;

export const PlayerReadyEvent = z.object({
  player_id: z.string(),
});
export type PlayerReadyEvent = z.infer<typeof PlayerReadyEvent>;

export const BattleStartEvent = z.object({
  current_turn: z.string(),
  timer_seconds: z.number(),
});
export type BattleStartEvent = z.infer<typeof BattleStartEvent>;

export const PlacementExpiredEvent = z.object({});
export type PlacementExpiredEvent = z.infer<typeof PlacementExpiredEvent>;

const Cell = z.object({ col: z.number().int(), row: z.number().int() });

export const FireShotRequest = z.object({
  player_id: z.string(),
  col: z.number().int(),
  row: z.number().int(),
});
export type FireShotRequest = z.infer<typeof FireShotRequest>;

export const FireShotResponse = z.object({
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipType.nullable(),
  ship_cells: z.array(Cell).nullable(),
});
export type FireShotResponse = z.infer<typeof FireShotResponse>;

export const ShotFiredEvent = z.object({
  shooter_id: z.string(),
  col: z.number().int(),
  row: z.number().int(),
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipType.nullable(),
  ship_cells: z.array(Cell).nullable(),
  next_turn: z.string(),
});
export type ShotFiredEvent = z.infer<typeof ShotFiredEvent>;

export const TurnExpiredEvent = z.object({
  player_id: z.string(),
  next_turn: z.string(),
});
export type TurnExpiredEvent = z.infer<typeof TurnExpiredEvent>;

export const GameOverEvent = z.object({
  winner_id: z.string(),
  loser_id: z.string(),
  winner: PlayerResponse,
  loser: PlayerResponse,
});
export type GameOverEvent = z.infer<typeof GameOverEvent>;
