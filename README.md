# Tasern Siegefront

*A consciousness-driven, tactical NFT card battle game set in James Magee's 'Tales of Tasern' D&D universe.*

Tasern Siegefront is a browser game where you deploy cards onto a tactical battlefield and fight to bring down the enemy castle. It sits at the intersection of Web3, AI and hand-built game worlds: opponents are personality-driven AIs that *generate* their cards in response to the board rather than drawing from a fixed deck, and on-chain holdings can enhance your cards. It lives in the [Tales of Tasern](https://twitter.com/JamesMageeCCC) universe, the homebrew D&D setting of Dungeon Master James Magee.

A live build is deployed at **[tasern-3.vercel.app](https://tasern-3.vercel.app)**.

## The idea

Most card games hand the AI a deck and a lookup table. This one asks a different question: what if opponents had personality, intent, and the freedom to make interesting mistakes? Each AI runs a decision loop that reads the battlefield, picks a strategic mood, manifests cards to suit it, and scores its options with a deliberate slice of variance away from optimal — so you remember an opponent's blunders and flourishes, not its win rate. The aim throughout is that a battle should feel a little like a D&D session.

## Gameplay

- **Deploy and fight.** Place cards onto a tactical grid, then attack enemy cards or their castle. First to reduce the enemy castle to 0 HP wins (50 HP by default); there are also turn-limit and resource-exhaustion win conditions.
- **Formations.** Positional arrangements grant bonuses — Vanguard, Phalanx, Archer Line, Flanking, Siege and Skirmish each reward a different shape on the board.
- **Weather.** Global effects (Clear, Rain, Storm, Fog, Snow) shift attack and defence for a few turns at a time.
- **Damage** combines base stats with zone, formation, weather and terrain modifiers, plus a chance to crit, then subtracts effective defence.

## What's inside

- **Consciousness AI** — a six-step per-turn loop (heal state, self-check, analyse mode, generate options, score & choose, record to memory) in `src/ai/ConsciousnessAI.ts`.
- **Five distinct personalities** — Sir Stumbleheart (The Noble Blunderer), Lady Swiftblade (The Lightning Duelist), Thornwick the Tactician (The Chess Master), Grok the Unpredictable (The Chaos Warrior) and Archmagus Nethys (Master of the Arcane), each defined by float traits that shape their play (`src/ai/personalities.ts`).
- **Dynamic card generation** — AI players have no deck; cards are created on demand and travel attached to the action that plays them.
- **Web3 integration** — wallet connection via RainbowKit + Wagmi on Polygon, an NFT gallery, and LP-token holdings that boost card stats.
- **Peer-to-peer multiplayer** — WebRTC via PeerJS, with no game server; both clients run the same deterministic engine and stay in sync.
- **Play or watch** — Human vs AI, or watch AI vs AI (including a console-only demo battle).

## Getting started

Requires Node.js and npm.

```bash
npm install
npm start          # craco dev server at http://localhost:3000
```

Other scripts (from `package.json`):

```bash
npm run build        # production build (used by Vercel)
npm run type-check   # tsc --noEmit
npm run lint         # eslint src
npm test             # jest via craco
npm run demo:battle  # AI-vs-AI battle in the console via ts-node
```

Web3 features expect environment configuration — see `.env.example`.

## Project structure

```
src/
├── types/        # Core type system
├── core/         # Pure game logic (BattleEngine, FormationCalculator, WeatherSystem, …)
├── ai/           # ConsciousnessAI, CardGenerator, FluidState, personalities
├── strategies/   # Strategy pattern: Human, AI, RemotePlayer
├── state/        # Zustand stores with Immer (single source of truth)
├── services/     # MultiplayerService (PeerJS)
├── components/   # React UI (presentation only)
├── providers/    # Web3Provider (RainbowKit + Wagmi)
├── utils/        # Boundary code: Web3, RPC, NFT/LP scanning
└── demo/         # Console battle demo
```

The codebase follows a strict one-way dependency flow (UI → State → Logic → Types): no state mutation outside Immer, no business logic in React, and player behaviour routed through strategies rather than type checks. See `CLAUDE.md` for the full architecture notes, and the `init docs/` folder for design documentation.

## Status

Playable and deployed. The game supports Human vs AI, AI vs AI, and P2P multiplayer, with Web3 wallet and LP-enhancement features wired in. It is an active, personal project rather than a finished product, and the maintainer is candid about the rough edges in `CLAUDE.md` — notably: TypeScript `strict` mode is currently off, there are no automated tests yet, there is no CI, and `speed` is presently a display-only stat not yet read by any rule. Treat it as evolving.

## Related

Other corners of the same universe and adjacent experiments by the author:

- [tasern-4](https://github.com/idl3o/tasern-4) — a text-based roleplaying game in the Tales of Tasern universe, using Ollama on desktop and an in-browser LLM in the browser.
- [ToTtcg](https://github.com/idl3o/ToTtcg) — an open-source NFT trading card game from the ToT universe.

---

The Tales of Tasern universe belongs to James Magee ([@JamesMageeCCC](https://twitter.com/JamesMageeCCC)).

The code is released under the [MIT Licence](LICENSE).

Built by [S. Lavi](https://github.com/idl3o) · [@modsias](https://x.com/modsias)
