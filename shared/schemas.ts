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
