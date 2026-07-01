-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  phase text DEFAULT 'lobby', -- lobby | tasks | meeting | voting | ended
  meeting_reason text,
  reporter_id uuid REFERENCES bichos(id),
  body_id uuid REFERENCES bichos(id),
  winner text, -- crewmates | impostors | null
  voting_ends_at timestamptz,
  task_bar_progress float DEFAULT 0
);

-- Player roles and status
CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  bicho_id uuid REFERENCES bichos(id),
  role text DEFAULT 'crewmate', -- crewmate | impostor
  is_alive boolean DEFAULT true,
  kill_cooldown_until timestamptz,
  UNIQUE(session_id, bicho_id)
);

-- Bodies on the floor
CREATE TABLE IF NOT EXISTS bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  victim_id uuid REFERENCES bichos(id),
  killer_id uuid REFERENCES bichos(id),
  floor_index int DEFAULT 0,
  x float DEFAULT 400,
  y float DEFAULT 300,
  reported boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Meeting votes
CREATE TABLE IF NOT EXISTS meeting_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES bichos(id),
  voted_for uuid REFERENCES bichos(id), -- NULL = skip
  UNIQUE(session_id, voter_id)
);

-- Meeting chat
CREATE TABLE IF NOT EXISTS meeting_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  bicho_id uuid REFERENCES bichos(id),
  bicho_name text,
  bicho_color text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS policies (permissive for now)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bodies" ON bodies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all meeting_votes" ON meeting_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all meeting_chat" ON meeting_chat FOR ALL USING (true) WITH CHECK (true);
