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
