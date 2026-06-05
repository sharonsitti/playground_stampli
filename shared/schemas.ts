import { z } from "zod";

export const PRESET_SECONDS: Record<"quick" | "casual", number> = {
  quick: 30,
  casual: 60,
};

export const SHIP_SIZES: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

export const PresetSchema = z.enum(["quick", "casual"]);
export const ShipTypeSchema = z.enum([
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer",
]);
export const OrientationSchema = z.enum(["H", "V"]);

export const ColSchema = z.number().int().min(0).max(9);
export const RowSchema = z.number().int().min(1).max(10);

export const CellSchema = z.object({
  col: ColSchema,
  row: RowSchema,
});

export const PlayerStatsSchema = z.object({
  id: z.string(),
  name: z.string(),
  games_played: z.number(),
  wins: z.number(),
  losses: z.number(),
  win_rate: z.number(),
});

// POST /api/players
export const CreatePlayerRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export const CreatePlayerResponseSchema = PlayerStatsSchema;

// GET /api/games
export const LobbyGameSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  creator: PlayerStatsSchema,
});
export const ListGamesResponseSchema = z.object({
  games: z.array(LobbyGameSchema),
});

// POST /api/games
export const CreateGameRequestSchema = z.object({
  creator_id: z.string(),
  preset: PresetSchema,
});
export const CreateGameResponseSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  status: z.literal("waiting"),
  creator_id: z.string(),
});

// POST /api/games/:gameId/join
export const JoinGameRequestSchema = z.object({
  player_id: z.string(),
});
export const JoinGameResponseSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  status: z.literal("placing"),
  creator_id: z.string(),
  joiner_id: z.string(),
});

// DELETE /api/games/:gameId
export const CancelGameRequestSchema = z.object({
  player_id: z.string(),
});
export const CancelGameResponseSchema = z.object({
  ok: z.literal(true),
});

// POST /api/games/:gameId/place
export const ShipPlacementSchema = z.object({
  type: ShipTypeSchema,
  orientation: OrientationSchema,
  origin_col: ColSchema,
  origin_row: RowSchema,
});
export const PlaceShipsRequestSchema = z.object({
  player_id: z.string(),
  ships: z.array(ShipPlacementSchema),
});
export const PlaceShipsResponseSchema = z.object({
  ok: z.literal(true),
});

// POST /api/games/:gameId/ready
export const ReadyRequestSchema = z.object({
  player_id: z.string(),
});
export const ReadyResponseSchema = z.object({
  ok: z.literal(true),
});

// POST /api/games/:gameId/shot
export const ShotRequestSchema = z.object({
  player_id: z.string(),
  col: ColSchema,
  row: RowSchema,
});
export const ShotResponseSchema = z.object({
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipTypeSchema.nullable(),
  ship_cells: z.array(CellSchema).nullable(),
});

// Lobby SSE events (GET /api/lobby/events)
export const GameCreatedEventSchema = LobbyGameSchema;
export const GameRemovedEventSchema = z.object({
  id: z.string(),
});

// Game SSE events (GET /api/games/:gameId/events)
export const PlayerJoinedEventSchema = z.object({
  joiner: z.object({
    id: z.string(),
    name: z.string(),
  }),
  timer_seconds: z.number(),
});
export const TimerTickEventSchema = z.object({
  seconds_remaining: z.number(),
});
export const PlayerReadyEventSchema = z.object({
  player_id: z.string(),
});
export const BattleStartEventSchema = z.object({
  current_turn: z.string(),
  timer_seconds: z.number(),
});
export const PlacementExpiredEventSchema = z.object({});
export const ShotFiredEventSchema = z.object({
  shooter_id: z.string(),
  col: ColSchema,
  row: RowSchema,
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipTypeSchema.nullable(),
  ship_cells: z.array(CellSchema).nullable(),
  next_turn: z.string(),
});
export const TurnExpiredEventSchema = z.object({
  player_id: z.string(),
  next_turn: z.string(),
});
export const GameOverEventSchema = z.object({
  winner_id: z.string(),
  loser_id: z.string(),
  winner: PlayerStatsSchema,
  loser: PlayerStatsSchema,
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type Preset = z.infer<typeof PresetSchema>;
export type ShipType = z.infer<typeof ShipTypeSchema>;
export type Orientation = z.infer<typeof OrientationSchema>;
export type Cell = z.infer<typeof CellSchema>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export type CreatePlayerRequest = z.infer<typeof CreatePlayerRequestSchema>;
export type CreatePlayerResponse = z.infer<typeof CreatePlayerResponseSchema>;
export type LobbyGame = z.infer<typeof LobbyGameSchema>;
export type ListGamesResponse = z.infer<typeof ListGamesResponseSchema>;
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>;
export type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;
export type JoinGameResponse = z.infer<typeof JoinGameResponseSchema>;
export type CancelGameRequest = z.infer<typeof CancelGameRequestSchema>;
export type CancelGameResponse = z.infer<typeof CancelGameResponseSchema>;
export type ShipPlacement = z.infer<typeof ShipPlacementSchema>;
export type PlaceShipsRequest = z.infer<typeof PlaceShipsRequestSchema>;
export type PlaceShipsResponse = z.infer<typeof PlaceShipsResponseSchema>;
export type ReadyRequest = z.infer<typeof ReadyRequestSchema>;
export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;
export type ShotRequest = z.infer<typeof ShotRequestSchema>;
export type ShotResponse = z.infer<typeof ShotResponseSchema>;
export type GameCreatedEvent = z.infer<typeof GameCreatedEventSchema>;
export type GameRemovedEvent = z.infer<typeof GameRemovedEventSchema>;
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEventSchema>;
export type TimerTickEvent = z.infer<typeof TimerTickEventSchema>;
export type PlayerReadyEvent = z.infer<typeof PlayerReadyEventSchema>;
export type BattleStartEvent = z.infer<typeof BattleStartEventSchema>;
export type PlacementExpiredEvent = z.infer<typeof PlacementExpiredEventSchema>;
export type ShotFiredEvent = z.infer<typeof ShotFiredEventSchema>;
export type TurnExpiredEvent = z.infer<typeof TurnExpiredEventSchema>;
export type GameOverEvent = z.infer<typeof GameOverEventSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
