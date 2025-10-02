/**
 * Supabase Database Schema
 *
 * Run this SQL in Supabase SQL Editor to create tables
 */

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  lp_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID REFERENCES users(id) NOT NULL,
  player2_id UUID REFERENCES users(id) NOT NULL,
  state JSONB NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'active', 'completed')) DEFAULT 'active',
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match queue table
CREATE TABLE match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'matched')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_players ON games(player1_id, player2_id);
CREATE INDEX idx_queue_waiting ON match_queue(status, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read all users (for opponent info)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::uuid = id);

-- Users can view games they're part of
CREATE POLICY "Users can view their games" ON games
  FOR SELECT USING (
    auth.uid()::uuid = player1_id OR
    auth.uid()::uuid = player2_id
  );

-- Users can update games they're part of (for actions)
CREATE POLICY "Users can update their games" ON games
  FOR UPDATE USING (
    auth.uid()::uuid = player1_id OR
    auth.uid()::uuid = player2_id
  );

-- Users can join queue
CREATE POLICY "Users can manage own queue" ON match_queue
  FOR ALL USING (auth.uid()::uuid = user_id);

-- Enable Realtime for games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games table
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
