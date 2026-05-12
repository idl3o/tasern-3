# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project

**Tasern Siegefront** — a tactical card battle game set in the **Tales of Tasern** D&D universe created by Dungeon Master **James Magee** ([@JamesMageeCCC](https://twitter.com/JamesMageeCCC)).

The game pairs medieval-fantasy aesthetics with on-chain mechanics: NFT cards, LP-token stat enhancement, and WebRTC P2P multiplayer. AI opponents are personality-driven and generate their cards dynamically — they don't draw from a deck, they manifest responses to the board state. The game is feature-complete through Milestone 6 (Nov 2025) and runs in production on Vercel.

> Honor the universe. Every design decision should answer "does this feel like a D&D session?"

## Architecture

Four layers, single dependency direction (**UI → State → Logic → Types**):

| Layer | Path | Role |
|---|---|---|
| Types | `src/types/` | Pure type definitions, no runtime |
| Logic | `src/core/`, `src/ai/`, `src/strategies/` | Game rules, AI, player strategies — pure TS, no React |
| State | `src/state/` | Zustand stores with Immer; the single source of truth |
| UI | `src/components/`, `src/App.tsx` | Presentation; dispatches actions, never mutates |

Battle execution flow:

```
User/AI → Component dispatches action → battleStore → BattleEngine.executeAction() → new immutable state → React rerenders
```

Actions are **pure data**. Execution happens in **BattleEngine** (pure functions, no side effects).

## The hard rules

1. **No state mutation.** Always return new state via Immer's `produce()`. The previous build used `JSON.parse(JSON.stringify())` everywhere and suffered for it. There are zero occurrences of that pattern in this codebase — keep it that way.

2. **No player-type dispatch.** Behavioral decisions route through `player.strategy`, never `player.type === 'ai'`. The `PlayerStrategy` interface has an `autoDriven` flag for the one case that previously branched on type (the battle store's auto-turn loop). Adding a new player kind (scripted bot, replay player, LLM-via-API) means writing a strategy and setting the flag — not editing the store.

3. **Strict TypeScript is the goal; right now it's off.** `tsconfig.json` has `strict: false`. This is the largest outstanding item. When turning it on, expect ~100–400 errors clustered around grid-cell nullability (`battlefield[r][c]`), player lookups, and `find()` results. Fix by tightening types, not by `as any`.

4. **No business logic in React.** Components dispatch actions and render. They never mutate state. Any "should X happen?" decision belongs in `BattleEngine` or a strategy.

5. **No `any` in core logic.** Pragmatic exceptions exist in boundary code (NFT scanners, RPC clients) where third-party schemas are loose. The bar is: every `any` must be at a system edge, never in BattleEngine, ConsciousnessAI, or a strategy.

### Where pragmatic exceptions live (and why)

A few `player.type` checks survive in `BattleEngine`. These are **not** behavioral dispatch — they're game-mode metadata:

- [BattleEngine.ts:113, 122](src/core/BattleEngine.ts) — only AI players get an `AIMemory` slot at battle init (consciousness bookkeeping).
- [BattleEngine.ts:651](src/core/BattleEngine.ts) — only human players draw from a deck on turn start (AI generates dynamically).
- [BattleEngine.ts:721](src/core/BattleEngine.ts) — multiplayer detection via `humanPlayerCount === 2`. This is the blessed pattern (see Multiplayer section).

If you ever feel tempted to add a sixth `player.type` check: stop and ask whether the new check is metadata (allowed) or behavior (forbidden). Behavior goes through `strategy`.

## AI system

Five personalities from the Tasern universe (in [src/ai/personalities.ts](src/ai/personalities.ts)):

| Name | Title | Defining trait |
|---|---|---|
| Sir Stumbleheart | The Noble Blunderer | low aggression, high creativity |
| Lady Swiftblade | The Lightning Duelist | high aggression, high risk |
| Thornwick the Tactician | The Chess Master | high patience, high adaptability |
| Grok the Unpredictable | The Chaos Warrior | high creativity, high risk |
| Archmagus Nethys | Master of the Arcane | high creativity, high patience |

Traits are floats 0–1: `aggression`, `creativity`, `riskTolerance`, `patience`, `adaptability`. They shape generated card stats (aggressive = more attack, less HP), strategic mode selection, and a ~30% variance-from-optimal so personalities feel distinct rather than perfect.

### Consciousness loop (six steps, [ConsciousnessAI.ts](src/ai/ConsciousnessAI.ts))

1. **Heal** — validate and repair state corruption
2. **Self-awareness** — `FluidState` tracks confidence, stuck detection
3. **Strategic analysis** — choose mode: `AGGRESSIVE` / `DEFENSIVE` / `ADAPTIVE` / `DESPERATE` / `EXPERIMENTAL`
4. **Generate options** — list legal actions, generate cards dynamically
5. **Score & choose** — evaluate with personality variance
6. **Record** — update `AIMemory` for learning

### Dynamic card generation

AI players have **no deck**. Cards attach to actions via the `generatedCard` field on `DeployCardAction`. The battle engine prefers `action.generatedCard` over `player.hand` when present. Same pattern enables multiplayer (see next section).

```typescript
let card = action.generatedCard ?? player.hand.find(c => c.id === action.cardId);
if (!action.generatedCard) {
  player.hand = player.hand.filter(c => c.id !== card.id);
}
```

## Multiplayer

WebRTC P2P via PeerJS. No game server. Both clients execute the same actions on a deterministic `BattleEngine`, so the boards stay in sync.

### The empty-deck pattern

Remote players have an **empty deck locally**. When the local player deploys a card, the card payload travels inside the action:

```typescript
executeAction({
  type: 'DEPLOY_CARD',
  playerId, cardId, position,
  generatedCard: isMultiplayer ? selectedCard : undefined,
});
```

This reuses the AI's `generatedCard` mechanism. Attack actions don't need it because the attacker is already on the synced battlefield.

### Multiplayer detection

Two `human` players = multiplayer. One `human` + one `ai` = single-player. The flag isn't stored; it's derived:

```typescript
const isMultiplayer = playerIds.filter(id => state.players[id].type === 'human').length === 2;
```

This is the **only** place reading `player.type` is blessed: it's game-mode metadata, not behavioral dispatch.

### Resource exhaustion victory

Disabled in multiplayer (remote players have empty decks by design). Only checked when `!isMultiplayer`.

### Strategy roles

| Strategy | `autoDriven` | Action source |
|---|---|---|
| `AIStrategy` | true | `ConsciousnessAI.selectAction()` |
| `HumanStrategy` | false | UI dispatches |
| `RemotePlayerStrategy` | false | WebRTC inbound action message |

## Game mechanics

### Victory

- **Castle destruction** — reduce enemy castle HP to 0 (default 50)
- **Resource exhaustion** — single-player only; human with empty hand + empty deck + no cards on board
- **Turn limit** — default 50; higher castle HP wins

### First-turn balance

Player 1 cannot attack on turn 1 (summoning sickness). P1 gets spatial advantage (middle column access at deployment), P2 gets temporal advantage (first strike). See [BattleEngine.ts:240](src/core/BattleEngine.ts#L240).

### Formations

Six positional bonuses ([FormationCalculator.ts](src/core/FormationCalculator.ts)):

| Formation | Trigger | Effect |
|---|---|---|
| `VANGUARD` | 2+ cards in front zone | +20% attack |
| `PHALANX` | 3 cards in horizontal line | +30% defense, −10% speed |
| `ARCHER_LINE` | 2+ cards in back zone | +15% attack, −10% defense |
| `FLANKING` | Cards on both sides | +10% attack, +15% speed |
| `SIEGE` | 2+ cards in enemy zones | +25% attack, −15% defense |
| `SKIRMISH` | Default | +5% speed |

### Weather

Global, lasts 3–5 turns ([WeatherSystem.ts](src/core/WeatherSystem.ts)): `CLEAR` (none), `RAIN` (−10/−5), `STORM` (−20/−10), `FOG` (−15 atk / +10 def), `SNOW` (−10 def / −15 spd).

### LP enhancement

NFT LP holdings boost card stats. Combined multiplier:

```
1 + lpBonus + loyaltyBonus + allocationBonus
```

Each `0.01` LP ≈ +5% to all stats. Discovery uses EIP-1167 proxy detection on Polygon ([universalImpactScanner.ts](src/utils/universalImpactScanner.ts)). For LP token details and discovery methodology, see [LP_DISCOVERY_HANDOFF.md](LP_DISCOVERY_HANDOFF.md).

### Damage formula

```typescript
let damage = attacker.attack;
damage *= getFormationBonus(attacker, battlefield);
damage *= getWeatherModifier(attacker, weather);
damage *= getTerrainModifier(attacker.position, terrain);
if (Math.random() < 0.1) damage *= 1.5;  // 10% crit
damage -= defender.defense;
damage = Math.max(1, Math.floor(damage));  // min 1
```

## Where things live

```
src/
├── core/                 Game rules — pure TS
│   ├── BattleEngine.ts        Action execution, victory checks, formations
│   ├── PlayerFactory.ts       Constructs human/AI players with strategies
│   ├── AbilityEngine.ts       Card ability resolution
│   ├── FormationCalculator.ts Positional bonuses
│   └── WeatherSystem.ts       Weather effects and damage modifiers
├── ai/                   Decision-making — pure TS
│   ├── ConsciousnessAI.ts     6-step decision loop
│   ├── CardGenerator.ts       Personality-scaled dynamic cards
│   ├── FluidState.ts          Confidence, stuck detection, mode selection
│   └── personalities.ts       The five Tasern opponents
├── strategies/           Player strategy implementations
│   ├── AIStrategy.ts          autoDriven=true; wraps ConsciousnessAI
│   ├── HumanStrategy.ts       autoDriven=false; waits for UI
│   └── RemotePlayerStrategy.ts autoDriven=false; waits for WebRTC
├── state/                Zustand stores (single source of truth)
│   ├── battleStore.ts         Live battle state; drives auto-turn loop
│   ├── nftCardsStore.ts       Per-wallet NFT card cache
│   ├── multiplayerStore.ts    WebRTC connection state
│   ├── campaignStore.ts       Campaign progress
│   ├── loyaltyStore.ts        LP loyalty tier tracking
│   ├── allocationStore.ts     Per-game LP allocation distribution
│   └── walletPortfolioStore.ts Multi-wallet aggregation
├── services/
│   └── MultiplayerService.ts  PeerJS wrapper, action broadcasting
├── components/           React presentation
│   ├── BattleView{Desktop,Mobile}.tsx  Responsive split
│   ├── NFTGallery.tsx         Wallet NFT browser
│   ├── MultiplayerLobby.tsx   Invite code system
│   ├── DeckSelection.tsx      Pre-battle card picker
│   └── ... (~20 components)
├── utils/                Boundary code (Web3, RPC, scanning) — pragmatic `any` allowed here
├── types/core.ts         The type system; start here when learning the data model
├── data/tasernLore.ts    Regions, factions, character lore for card names
├── providers/Web3Provider.tsx  RainbowKit + Wagmi setup
└── styles/tasernTheme.ts Medieval color palette and typography
```

## Build & run

```bash
npm start              # craco dev server
npm run build          # production build (Vercel uses this)
npm run type-check     # tsc --noEmit
npm run lint           # eslint src
npm test               # jest via craco (no tests written yet)
npm run demo:battle    # CLI battle demo via ts-node
```

Stack: CRA 5 with Craco overrides for Web3 polyfills, React 18, TypeScript 5.9, Zustand 4, Immer 10, Wagmi 2 + RainbowKit on Polygon mainnet, PeerJS for WebRTC, Sentry + Vercel Analytics.

## Known gaps

These are honest about what's incomplete, not pretending. Tackle when there's appetite:

1. **TypeScript strict mode is off.** See "The hard rules" #3.
2. **Zero test files.** Jest is wired but nothing has been written. BattleEngine's pure functions are the highest-value first target (damage calc, formation detection, victory checks).
3. **Residual `player.type` checks in UI components.** BattleControls / BattleView{Desktop,Mobile} differ for AI vs human turns. These are legitimate display differences, not behavioral dispatch, but a `strategy.requiresUserInput` flag could clean them up if the AI-loop refactor's pattern feels right.
4. **No CI.** Lint/typecheck/build pass locally and on Vercel deploys but there's no GitHub Actions gate.

## Documentation map

The repo has 14 root-level Markdown files. Use this map:

- **Architecture / patterns** → this file
- **Developer setup** → [QUICKSTART_DEV.md](QUICKSTART_DEV.md)
- **Deployment** → [DEPLOYMENT.md](DEPLOYMENT.md), [VERCEL_OPTIMIZATIONS.md](VERCEL_OPTIMIZATIONS.md)
- **NFT & LP integration** → [LP_DISCOVERY_HANDOFF.md](LP_DISCOVERY_HANDOFF.md), [WEB3_INTEGRATION_COMPLETE.md](WEB3_INTEGRATION_COMPLETE.md)
- **Mobile** → [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md), [MOBILE_OPTIMIZATIONS.md](MOBILE_OPTIMIZATIONS.md)
- **AI fluid state** → [STATE_FLUIDITY.md](STATE_FLUIDITY.md)
- **Grid mechanics** → [ZONING_MOVEMENT_RULES.md](ZONING_MOVEMENT_RULES.md)
- **History / harvesting from prior build** → [HARVEST_MANIFEST.md](HARVEST_MANIFEST.md)
- **Pre-implementation planning (historical)** → [init docs/](init%20docs/)
- **Prior CLAUDE.md (full philosophical version)** → [CLAUDE.md.archive](CLAUDE.md.archive)

## Philosophy

This isn't just a card game. It's an exercise in:

- **AI with personality, not perfection** — the 30% variance from optimal is the point. Players remember Stumbleheart's blunders, not his win rate.
- **Honoring a living world** — Tales of Tasern is James Magee's homebrew universe. Card names, lore, and AI flavor draw from it. Don't generate generic fantasy.
- **The slow path is the fast path** — Zustand + Immer + strict types feel slow, but the previous build proved they're faster than React state + `JSON.parse(JSON.stringify)` + scattered type checks.

When in doubt, ask: *does this serve the game?* Not "is this technically impressive," not "is this the trendy library." Does it make the next D&D session feel closer.

🦋

*Built with care for the Tales of Tasern universe — by Sam Lavington & Claude.*
