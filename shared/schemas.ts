import { z } from "zod";

export const PRESET_SECONDS: Record<"quick" | "casual", number> = {
  quick: 30,
  casual: 60,
};

export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const CreatePlayerRequestSchema = z.object({
  name: z.string().max(40),
});
export type CreatePlayerRequest = z.infer<typeof CreatePlayerRequestSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  games_played: z.number(),
  wins: z.number(),
  losses: z.number(),
  win_rate: z.number(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const PresetSchema = z.enum(["quick", "casual"]);
export type Preset = z.infer<typeof PresetSchema>;

export const GameStatusSchema = z.enum([
  "waiting",
  "placing",
  "battle",
  "finished",
]);
export type GameStatus = z.infer<typeof GameStatusSchema>;

export const CreateGameRequestSchema = z
  .object({
    creator_id: z.string(),
    preset: PresetSchema,
  })
  .strict();
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;

export const CreateGameResponseSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  status: z.literal("waiting"),
  creator_id: z.string(),
});
export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>;

export const JoinGameRequestSchema = z
  .object({
    player_id: z.string(),
  })
  .strict();
export type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;

export const JoinGameResponseSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  status: z.literal("placing"),
  creator_id: z.string(),
  joiner_id: z.string(),
});
export type JoinGameResponse = z.infer<typeof JoinGameResponseSchema>;

export const DeleteGameRequestSchema = z
  .object({
    player_id: z.string(),
  })
  .strict();
export type DeleteGameRequest = z.infer<typeof DeleteGameRequestSchema>;

export const DeleteGameResponseSchema = z.object({
  ok: z.literal(true),
});
export type DeleteGameResponse = z.infer<typeof DeleteGameResponseSchema>;

export const GameSummarySchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  creator: PlayerSchema,
});
export type GameSummary = z.infer<typeof GameSummarySchema>;

export const ListGamesResponseSchema = z.object({
  games: z.array(GameSummarySchema),
});
export type ListGamesResponse = z.infer<typeof ListGamesResponseSchema>;

export const GameCreatedEventSchema = z.object({
  id: z.string(),
  preset: PresetSchema,
  creator: PlayerSchema,
});
export type GameCreatedEvent = z.infer<typeof GameCreatedEventSchema>;

export const GameRemovedEventSchema = z.object({
  id: z.string(),
});
export type GameRemovedEvent = z.infer<typeof GameRemovedEventSchema>;

export const PlayerJoinedEventSchema = z.object({
  joiner: z.object({
    id: z.string(),
    name: z.string(),
  }),
  timer_seconds: z.number(),
});
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEventSchema>;

export const ShipTypeSchema = z.enum([
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer",
]);
export type ShipType = z.infer<typeof ShipTypeSchema>;

export const ShipPlacementSchema = z.object({
  type: ShipTypeSchema,
  orientation: z.enum(["H", "V"]),
  origin_col: z.number().int().min(0).max(9),
  origin_row: z.number().int().min(1).max(10),
});
export type ShipPlacement = z.infer<typeof ShipPlacementSchema>;

export const PlaceShipsRequestSchema = z
  .object({
    player_id: z.string(),
    ships: z.array(ShipPlacementSchema),
  })
  .strict();
export type PlaceShipsRequest = z.infer<typeof PlaceShipsRequestSchema>;

export const PlaceShipsResponseSchema = z.object({ ok: z.literal(true) });
export type PlaceShipsResponse = z.infer<typeof PlaceShipsResponseSchema>;

export const ReadyRequestSchema = z.object({ player_id: z.string() }).strict();
export type ReadyRequest = z.infer<typeof ReadyRequestSchema>;

export const ReadyResponseSchema = z.object({ ok: z.literal(true) });
export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;

export const TimerTickEventSchema = z.object({
  seconds_remaining: z.number().int(),
});
export type TimerTickEvent = z.infer<typeof TimerTickEventSchema>;

export const PlayerReadyEventSchema = z.object({ player_id: z.string() });
export type PlayerReadyEvent = z.infer<typeof PlayerReadyEventSchema>;

export const BattleStartEventSchema = z.object({
  current_turn: z.string(),
  timer_seconds: z.number().int(),
});
export type BattleStartEvent = z.infer<typeof BattleStartEventSchema>;

export const PlacementExpiredEventSchema = z.object({});
export type PlacementExpiredEvent = z.infer<typeof PlacementExpiredEventSchema>;

export const ShotRequestSchema = z
  .object({
    player_id: z.string(),
    col: z.number().int().min(0).max(9),
    row: z.number().int().min(1).max(10),
  })
  .strict();
export type ShotRequest = z.infer<typeof ShotRequestSchema>;

export const ShotResponseSchema = z.object({
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipTypeSchema.nullable(),
  ship_cells: z
    .array(z.object({ col: z.number(), row: z.number() }))
    .nullable(),
});
export type ShotResponse = z.infer<typeof ShotResponseSchema>;

export const ShotFiredEventSchema = z.object({
  shooter_id: z.string(),
  col: z.number(),
  row: z.number(),
  hit: z.boolean(),
  sunk: z.boolean(),
  ship_type: ShipTypeSchema.nullable(),
  ship_cells: z
    .array(z.object({ col: z.number(), row: z.number() }))
    .nullable(),
  next_turn: z.string(),
});
export type ShotFiredEvent = z.infer<typeof ShotFiredEventSchema>;

export const TurnExpiredEventSchema = z.object({
  player_id: z.string(),
  next_turn: z.string(),
});
export type TurnExpiredEvent = z.infer<typeof TurnExpiredEventSchema>;

export const GameOverEventSchema = z.object({
  winner_id: z.string(),
  loser_id: z.string(),
  winner: PlayerSchema,
  loser: PlayerSchema,
});
export type GameOverEvent = z.infer<typeof GameOverEventSchema>;
