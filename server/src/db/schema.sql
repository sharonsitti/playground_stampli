CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  preset TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  creator_id TEXT NOT NULL REFERENCES players(id),
  joiner_id TEXT REFERENCES players(id),
  current_turn TEXT REFERENCES players(id),
  winner_id TEXT REFERENCES players(id),
  creator_ready INTEGER NOT NULL DEFAULT 0,
  joiner_ready INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

CREATE TABLE IF NOT EXISTS ships (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  type TEXT NOT NULL,
  orientation TEXT NOT NULL,
  origin_col INTEGER NOT NULL,
  origin_row INTEGER NOT NULL,
  sunk INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ships_game_player ON ships(game_id, player_id);
