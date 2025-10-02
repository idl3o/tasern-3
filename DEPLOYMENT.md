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

### 2. Alchemy Setup

1. Go to [alchemy.com](https://www.alchemy.com) and create account
2. Create new app on Polygon Mainnet
3. Copy API key from dashboard

### 3. WalletConnect Setup (Optional)

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID for WalletConnect support

### 4. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Alchemy (Polygon RPC + LP queries)
REACT_APP_ALCHEMY_API_KEY=your-alchemy-key

# WalletConnect (optional, for mobile wallets)
REACT_APP_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### 5. Install Dependencies

```bash
npm install @supabase/supabase-js @vercel/node
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query --legacy-peer-deps
```

### 6. Vercel Deployment

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

## Web3 Integration

### 1. Wrap App with Web3Provider

```tsx
// src/index.tsx
import { Web3Provider } from './providers/Web3Provider';

root.render(
  <Web3Provider>
    <App />
  </Web3Provider>
);
```

### 2. Add Wallet Connection

```tsx
import { WalletConnect } from './components/WalletConnect';

// In your menu/header
<WalletConnect />
```

### 3. Query Wallet Address

```tsx
import { useAccount } from 'wagmi';

function MyComponent() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return <div>Please connect wallet</div>;
  }

  // Use address for authentication
}
```

### 4. LP Bonus Integration

LP bonuses are queried **server-side** in `api/game/create.ts` to prevent client manipulation:

```tsx
// Server queries LP holdings from blockchain
const lpData = await scanWalletForLPBonus(walletAddress, KNOWN_LP_CONTRACTS);

// Apply bonus to player (percentage)
player.lpBonus = lpData.totalBonus; // e.g., 5 = 5% boost to all stats
```

**Formula**: Each 0.01 LP token = +5% to all card stats

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
✅ **Server-side LP queries** - Prevents stat bonus manipulation

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

## Tech Stack Summary

**Web3**
- wagmi v2.17 - React hooks for Ethereum
- viem v2.37 - TypeScript Ethereum library
- RainbowKit v2.2 - Wallet connection UI
- Polygon mainnet via Alchemy RPC

**Backend**
- Vercel Serverless Functions (Node.js)
- Supabase Postgres + Realtime
- Server-side LP token queries (viem)

**Frontend**
- React 18 + TypeScript 5
- Zustand for state management
- Immer for immutability

---

## Next Steps

1. **Configure LP Contracts**: Add known LP token addresses to `KNOWN_LP_CONTRACTS` in `src/utils/lpTokenQuery.ts`
2. **Deploy to Vercel**: `vercel --prod`
3. **Test wallet connection**: Connect MetaMask and verify Polygon network
4. **Test LP bonuses**: Hold LP tokens and verify stat boosts in game
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
