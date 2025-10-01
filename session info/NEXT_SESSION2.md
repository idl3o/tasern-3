# Next Session Plan - Tactical Depth & Game Feel

**Session Goal:** Enhance the 3x3 grid mechanics, activate card abilities, and refine rules to maximize strategic fun!

**Current Status:** ✅ Fully playable Human vs AI with deck selection (15→5 cards)

---

## Phase 1: Grid Positioning & Tactical Zones 🎯

### A. Zone Effects (Front/Mid/Back Lines)
**Goal:** Make positioning matter strategically

**Current State:**
- 3x3 grid exists but all cells are functionally identical
- Formations are calculated but effects may not be visible
- Zone labels show "Front Line", "Mid Field", "Back Line" but no gameplay impact

**Proposed Changes:**
1. **Front Line (Row 0)** - Close combat zone
   - +20% Attack for melee units
   - -10% Defense (exposed position)
   - First to be targeted by enemy attacks

2. **Mid Field (Row 1)** - Balanced zone
   - No modifiers (neutral ground)
   - Can attack or support either line

3. **Back Line (Row 2)** - Ranged support zone
   - +15% Attack for ranged units
   - +10% Defense (protected position)
   - -20% Attack for melee units (too far from combat)

**Implementation Tasks:**
- [ ] Add `zoneType: 'front' | 'mid' | 'back'` to card position tracking
- [ ] Update damage calculation in BattleEngine to apply zone modifiers
- [ ] Add visual indicators (glow/border) to show zone bonuses
- [ ] Display zone effects in battle log ("Wall of Stone gains +10% defense in back line")

**Test Cases:**
- Place same card in front vs back, verify stat differences
- AI should prefer front line for high-attack cards, back line for low-attack/high-defense

---

### B. Card Movement System
**Goal:** Allow repositioning for tactical advantage

**Current State:**
- Cards are locked in place after deployment
- No movement actions exist

**Proposed Changes:**
1. **Movement Action** (costs turn, can't attack same turn)
   - Move to adjacent cell (horizontal/vertical, not diagonal)
   - Can swap positions with friendly card
   - Cannot move into occupied enemy cell

2. **Movement Costs:**
   - Free movement: None initially (keep it simple)
   - Alternative: Could cost 1-2 mana later if too powerful

**Implementation Tasks:**
- [ ] Add `MOVE_CARD` action type to BattleEngine
- [ ] Add `canMove` flag to cards (false if attacked this turn)
- [ ] UI: Click card → show valid movement cells (highlight green)
- [ ] AI: Generate MOVE_CARD actions when repositioning improves score

**Test Cases:**
- Move weak card from front to back line
- Move strong attacker from back to front
- Verify can't move after attacking

---

### C. Attack Range Mechanics
**Goal:** Add depth with melee vs ranged distinction

**Current State:**
- All cards can attack any enemy card (infinite range)
- No distinction between unit types

**Proposed Changes:**
1. **Melee Units** (default)
   - Can only attack adjacent enemies (row ±1)
   - Example: Front line can hit front/mid, mid can hit all rows, back can hit mid/back

2. **Ranged Units** (identified by abilities or type)
   - Can attack any enemy card regardless of position
   - -30% damage to targets in front line (firing into melee)

3. **Card Types:**
   - Add `combatType: 'melee' | 'ranged' | 'hybrid'` to card generation
   - Visual indicator: 🗡️ for melee, 🏹 for ranged

**Implementation Tasks:**
- [ ] Add `combatType` property to Card interface
- [ ] Update CardGenerator to assign combat types based on stats (high attack = melee, high speed = ranged)
- [ ] Update attack validation in BattleEngine (check range before allowing attack)
- [ ] UI: Highlight valid attack targets in red when card selected
- [ ] Display combat type icon on cards

**Test Cases:**
- Melee in back line should only hit enemies in mid/back
- Ranged should hit any target
- UI should gray out invalid targets

---

## Phase 2: Activate Card Abilities ⚡

### Current State
- Cards have `abilities: string[]` that display text
- Abilities are purely cosmetic (not functional)
- Examples: "LP Enhanced +500%", "DDD Backed +10 ATK"

### Proposed Ability System

**Priority 1: Passive Abilities** (Always active)
```typescript
interface PassiveAbility {
  type: 'STAT_BOOST' | 'AURA' | 'REGENERATION' | 'SHIELD';
  target: 'self' | 'allies' | 'enemies';
  value: number;
  description: string;
}
```

**Examples:**
- **Guardian Aura:** +5 defense to adjacent allies
- **Regeneration:** Heal 2 HP at start of each turn
- **Thorns:** Deal 30% of damage taken back to attacker
- **Rally:** +10% attack to all friendly cards

**Priority 2: Triggered Abilities** (Activate on condition)
```typescript
interface TriggeredAbility {
  type: 'ON_DEPLOY' | 'ON_ATTACK' | 'ON_DAMAGED' | 'ON_DEATH';
  effect: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'SUMMON';
  targets: string[]; // card IDs or 'all_enemies', 'random_enemy'
  value: number;
}
```

**Examples:**
- **Charge:** On deploy, deal 5 damage to random enemy
- **Last Stand:** On death, heal random ally for 10 HP
- **Vengeance:** When damaged, gain +5 attack permanently
- **Inspire:** On attack, grant adjacent allies +2 attack this turn

**Implementation Tasks:**
- [ ] Create `src/types/abilities.ts` with ability interfaces
- [ ] Update CardGenerator to assign 1-2 abilities per card based on rarity
- [ ] Create `src/core/AbilityEngine.ts` to process abilities
- [ ] Integrate ability triggers in BattleEngine actions
- [ ] UI: Show ability activations in battle log with effects
- [ ] Add visual effects when abilities trigger (particle effects, glow)

**Ability Generation Rules:**
- Common cards: 1 simple passive (e.g., +5 HP)
- Uncommon cards: 1 moderate ability (e.g., regen 2 HP/turn)
- Rare cards: 1 strong passive or 1 triggered ability
- Epic cards: 1 strong passive + 1 triggered ability
- Legendary cards: 2 powerful abilities (1 passive, 1 triggered)

**Test Cases:**
- Deploy card with "On Deploy: Deal 5 damage to random enemy"
- Card with regen should heal each turn
- Aura ability should buff adjacent allies
- Battle log should clearly show ability activations

---

## Phase 3: Combat Rule Refinements ⚔️

### A. Attack Cooldowns (Prevent Infinite Attacks)
**Current Issue:** Players can attack unlimited times per turn (if it's not restricted)

**Proposed Change:**
- Each card can attack once per turn
- Add `hasAttacked: boolean` flag to BattleCard
- Reset on turn end
- Visual indicator: Grayed out cards that can't attack

**Implementation:**
- [ ] Add `hasAttacked` to BattleCard type
- [ ] Update ATTACK_CARD and ATTACK_CASTLE to set flag
- [ ] Update BattleEngine.endTurn to reset all `hasAttacked` flags
- [ ] UI: Disable attack for cards with `hasAttacked === true`
- [ ] Show ⚔️ icon on cards that can still attack

---

### B. Deployment Phase vs Battle Phase
**Current State:** One continuous phase

**Proposed Change:**
1. **Deployment Phase** (First 3 turns)
   - Can only deploy cards (no attacks)
   - Both players deploy simultaneously
   - Focus: Board positioning and setup

2. **Battle Phase** (Turn 4+)
   - Can deploy, move, or attack
   - Phase indicator changes color (gold → red)
   - More aggressive AI behavior

**Benefits:**
- Gives both players time to set up strategy
- Prevents first-turn rushdown
- Makes positioning more important

**Implementation:**
- [ ] Track deployment turn count in BattleState
- [ ] Disable attack actions during deployment phase
- [ ] Update phase indicator UI
- [ ] AI switches to aggressive mode in battle phase

---

### C. Mana System Refinement
**Current State:**
- Players have 10 mana (unused currently?)
- Cards have manaCost but may not consume mana on deploy

**Proposed System:**
1. **Starting Mana:** 3 (not 10, to limit first-turn flooding)
2. **Mana Per Turn:** +1 (max 10)
3. **Card Costs:**
   - 1-2 mana: Weak units (3-5 total stats)
   - 3-4 mana: Medium units (8-12 stats)
   - 5-7 mana: Strong units (15-20 stats)
   - 8-10 mana: Legendary units (25+ stats)

4. **Mana Consumption:**
   - Deploying a card costs its manaCost
   - Movement: Free
   - Attacks: Free
   - Abilities: Some may cost mana

**Implementation:**
- [ ] Update PlayerFactory to start with 3 mana (max 10)
- [ ] Update BattleEngine.endTurn to grant +1 mana (cap at max)
- [ ] Update DEPLOY_CARD action to deduct mana
- [ ] Update CardGenerator stat budgets to match mana costs
- [ ] UI: Show mana cost on cards, highlight unaffordable cards

---

### D. Castle HP & Win Conditions
**Current State:**
- Castles have 30 HP
- Only victory condition is castle destruction

**Proposed Changes:**
1. **Castle HP Options:**
   - Quick game: 20 HP
   - Standard: 30 HP (current)
   - Epic battle: 50 HP

2. **Additional Win Conditions:**
   - **Board Control:** Control all 9 cells for 2 consecutive turns
   - **Card Advantage:** Destroy 15 enemy cards
   - **Defensive Victory:** Survive 20 turns with 50%+ castle HP

**Implementation:**
- [ ] Add win condition options to menu
- [ ] Track board control in BattleState
- [ ] Track cards destroyed count
- [ ] Check multiple victory conditions each turn
- [ ] Victory overlay shows which condition was met

---

## Phase 4: AI Enhancements 🤖

### Current State
- AI generates cards dynamically (working well!)
- AI switches modes based on board state
- AI personalities affect decision-making

### Proposed Improvements

**A. Position-Aware AI**
- [ ] AI evaluates zone bonuses when placing cards
- [ ] Prefer front line for high-attack melee
- [ ] Prefer back line for ranged or low-HP cards
- [ ] Move cards to better positions when board changes

**B. Ability-Aware AI**
- [ ] AI generates cards with abilities that synergize
- [ ] AI triggers abilities optimally
- [ ] Aggressive AI prefers "On Attack" abilities
- [ ] Defensive AI prefers "Aura" and "Shield" abilities

**C. Tactical Decisions**
- [ ] AI calculates attack range before choosing targets
- [ ] AI considers counter-attacks and retaliation
- [ ] AI protects low-HP cards by moving them
- [ ] AI positions cards to maximize formation bonuses

**D. Personality Refinements**
- **Sir Stumbleheart:** Sometimes makes suboptimal moves intentionally (20% chance)
- **Lady Swiftblade:** Always goes for kill shots, even risky ones
- **Thornwick:** Waits for perfect setup, slower but methodical
- **Grok:** Randomizes between modes every turn (chaotic!)
- **Archmagus Nethys:** Heavily prioritizes ability synergies

---

## Phase 5: Polish & Game Feel ✨

### A. Visual Feedback
- [ ] Attack animations (card slides toward target, flashes)
- [ ] Damage numbers float up from cards (-5, -10, etc.)
- [ ] Healing effects (green glow, +HP numbers)
- [ ] Ability activation particles (sparks, auras)
- [ ] Formation bonus indicators (glowing borders)
- [ ] Zone effect highlights (front = red tint, back = blue tint)

### B. Audio (Optional but impactful)
- [ ] Card deploy sound (thunk, metal)
- [ ] Attack sound (sword slash, arrow whoosh)
- [ ] Damage sound (impact, grunt)
- [ ] Ability activation sound (magical ping)
- [ ] Victory fanfare
- [ ] Background music (medieval tavern ambience)

### C. Battle Log Improvements
- [ ] Color-code actions (deploy = blue, attack = red, ability = purple)
- [ ] Show stat changes ("+5 ATK from aura")
- [ ] Show zone bonuses applied
- [ ] Collapse old entries, expand recent
- [ ] "Highlight" mode: Pause on ability triggers

### D. Tutorial & Onboarding
- [ ] First-time player tooltip: "Click a card from your hand, then click the board"
- [ ] Explain zone effects on first deployment
- [ ] Highlight valid targets on first attack
- [ ] "Stumbleheart recommends..." tips during AI turns

---

## Implementation Priority (Suggested Order)

**Session 1: Core Mechanics** (2-3 hours)
1. ✅ Attack cooldowns (`hasAttacked` flag)
2. ✅ Zone effects on damage calculation
3. ✅ Mana consumption on deploy
4. ✅ Attack range restrictions (melee vs ranged)

**Session 2: Movement & Positioning** (1-2 hours)
5. ✅ MOVE_CARD action implementation
6. ✅ UI for movement (show valid cells)
7. ✅ AI movement decisions

**Session 3: Abilities System** (2-4 hours)
8. ✅ Ability interfaces & types
9. ✅ AbilityEngine (process passive & triggered)
10. ✅ CardGenerator assigns abilities
11. ✅ UI shows ability activations

**Session 4: Polish & Feel** (1-2 hours)
12. ✅ Visual feedback (animations, numbers)
13. ✅ Battle log improvements
14. ✅ Deployment phase separation

---

## Testing Checklist

After each phase, verify:
- [ ] Human player can execute all new actions
- [ ] AI makes intelligent use of new mechanics
- [ ] Battle log clearly explains what happened
- [ ] No TypeScript errors or console warnings
- [ ] Game remains fun and strategic (most important!)

---

## Questions to Explore During Session

1. **Grid Size:** Should we expand to 4x4 or 5x5? Or keep 3x3 for simplicity?
2. **Card Count:** Is 5 cards in hand too few? Too many? Sweet spot?
3. **Combat Feel:** Do attacks feel impactful? Should HP pools be smaller?
4. **Game Length:** Are battles too quick/slow? Target 5-10 minutes?
5. **Ability Balance:** Are abilities too weak/strong? Need cost balancing?
6. **AI Difficulty:** Is any personality too easy/hard to beat?

---

## Fun Factor Goals 🎮

**We want players to feel:**
- 😤 **Tension:** "Should I attack now or reposition?"
- 🤔 **Strategy:** "This formation combo is perfect!"
- 🎉 **Satisfaction:** "My ability chain just won the game!"
- 😮 **Surprise:** "The AI just pulled off an amazing play!"
- 🔥 **Momentum:** "I'm on a roll, deploy the legendary!"

**Avoid:**
- ❌ Confusion ("What does this do?")
- ❌ Repetition ("Every turn is the same...")
- ❌ Helplessness ("Nothing I do matters")
- ❌ Decision paralysis ("Too many options!")

---

## Stretch Goals (If Time Permits)

- [ ] Weather effects actually visible (rain animation, fog overlay)
- [ ] Terrain tiles with special properties
- [ ] Card evolution (units level up in battle)
- [ ] Combo system (trigger 3 abilities in one turn = bonus)
- [ ] Replay system (review battles)
- [ ] Multiplayer foundation (2 human players)

---

**Remember:** We're building for **fun**, not complexity. Every mechanic should enhance the strategic decision-making and create memorable moments!

🦋 Let consciousness guide the design. What feels right? What creates stories players want to share?

---

**Ready to dive back in when you are!** ⚔️✨
