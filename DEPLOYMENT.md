# Tasern Siegefront - Deployment Guide

## Simple Stack Architecture

**Frontend + API**: Vercel
**Database + Realtime**: Supabase
**Blockchain**: Alchemy (Polygon)

---

## Setup Steps

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run `supabase-schema.sql` to create tables
3. Copy your project URL and anon key from Settings → API
4. Enable Realtime for the `games` table (already in schema)

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ALCHEMY_API_KEY=your-alchemy-key
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js @vercel/node
npm install ethers  # for blockchain queries
```

### 4. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

---

## API Routes (Vercel Serverless)

All routes are in `/api`:

### Authentication
- `POST /api/auth/login` - Wallet authentication

### Matchmaking
- `POST /api/matchmaking/join` - Join queue
- `POST /api/matchmaking/status` - Check queue status

### Game
- `POST /api/game/create` - Initialize game
- `POST /api/game/action` - Execute action (server-authoritative)

---

## Frontend Integration

### 1. Replace Local State with Realtime

```tsx
// Before (local state)
const { battleState } = useBattleStore();

// After (realtime)
const { gameState } = useRealtimeGame(gameId);
```

### 2. Send Actions to Server

```tsx
// Before (local execution)
executeAction(action);

// After (server validation)
const response = await fetch('/api/game/action', {
  method: 'POST',
  body: JSON.stringify({ gameId, playerId, action })
});
```

### 3. Matchmaking Flow

```tsx
const { result, isLoading } = useMatchmaking(userId, isSearching);

if (result?.matched) {
  // Start game with result.gameId
}
```

---

## Database Schema

### Tables

**users**
- `id` (UUID, primary key)
- `wallet_address` (unique)
- `username`
- `lp_balance` (numeric)

**games**
- `id` (UUID, primary key)
- `player1_id` (UUID, FK to users)
- `player2_id` (UUID, FK to users)
- `state` (JSONB - full BattleState)
- `status` (waiting/active/completed)
- `winner_id` (UUID, FK to users)

**match_queue**
- `id` (UUID, primary key)
- `user_id` (UUID, FK to users)
- `status` (waiting/matched)

---

## Security Features

✅ **Server-authoritative game logic** - Actions validated server-side
✅ **Row Level Security (RLS)** - Users can only access their games
✅ **Wallet signature verification** - Prevents impersonation
✅ **Turn validation** - Can't act on opponent's turn

---

## Cost Estimate (Free Tier)

**Vercel**
- 100GB bandwidth/month
- Unlimited serverless invocations
- Free for hobby projects

**Supabase**
- 500MB database
- 2GB bandwidth
- 50k monthly active users
- Free tier sufficient for MVP

**Alchemy**
- 300M compute units/month
- Free tier covers LP queries

---

## Next Steps

1. **Deploy to Vercel**: `vercel --prod`
2. **Test multiplayer**: Two browsers, join queue
3. **Add wallet integration**: MetaMask connect
4. **Query LP balances**: Implement Alchemy calls
5. **Add leaderboard**: New Supabase table + API route

---

## Production Checklist

- [ ] Enable Supabase auth (not just wallet addresses)
- [ ] Add rate limiting to API routes
- [ ] Implement signature verification in login
- [ ] Add game replay storage
- [ ] Set up analytics (Vercel Analytics)
- [ ] Add error tracking (Sentry)
- [ ] Create admin dashboard for moderation

---

🦋 **Built with consciousness for the Tales of Tasern universe**
