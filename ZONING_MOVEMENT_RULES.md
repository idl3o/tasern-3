# Zoning and Movement Rules

## Battlefield Layout

Players face each other **left-to-right** across a 3x3 grid:

```
        [Player 1]                    [Player 2]
        (Left Side)                   (Right Side)
             ↓                              ↓

    Col 0 (Left) | Col 1 (Center) | Col 2 (Right)
    ─────────────┼────────────────┼──────────────
       Row 0     │     Row 0      │    Row 0
    ─────────────┼────────────────┼──────────────
       Row 1     │     Row 1      │    Row 1
    ─────────────┼────────────────┼──────────────
       Row 2     │     Row 2      │    Row 2
```

**Depth axis is COLUMNS (left → right)**
**Rows are vertical positioning (top → bottom)**

---

## Deployment Zones

Players have restricted deployment zones based on **columns**:

### Zone Restrictions
- **Player 1 (Left Side)**: Can deploy to **columns 0-1** (Left Flank and Center)
- **Player 2 (Right Side)**: Can deploy to **columns 1-2** (Center and Right Flank)

### Battlefield Zones
```
Column 0 (Left Flank)  : Player 1 only ← [MELEE BONUS +20% ATK, -10% DEF]
Column 1 (Center)      : Both players can deploy ← [NEUTRAL - Contested!]
Column 2 (Right Flank) : Player 2 only ← [RANGED BONUS +15% ATK, +10% DEF]
```

### Strategic Implications
- **Player 1 (Left)** controls left flank and shares center
- **Player 2 (Right)** controls right flank and shares center
- Both players share **Center (column 1)** as contested territory
- Zone bonuses encourage positioning cards according to their combat type

---

## Movement Range Rules

Card movement is restricted based on **combat type** using Manhattan distance:

### Combat Type Movement Ranges

#### Melee Cards
- **Range**: 1 cell (adjacent only)
- **Movement**: Up, down, left, or right (no diagonals in one move)
- **Rationale**: Heavy armor/weapons limit mobility

#### Ranged Cards
- **Range**: Up to 2 cells
- **Movement**: Can move 2 spaces in cardinal directions
- **Rationale**: Lighter equipment allows better repositioning

#### Hybrid Cards
- **Range**: Up to 2 cells
- **Movement**: Balanced mobility like ranged
- **Rationale**: Versatility extends to movement

### Movement Mechanics
- Movement uses **Manhattan distance** (sum of row + column difference)
- Cards can only move to **empty cells**
- Cards can move **once per turn** (tracked via `hasMoved` flag)
- Movement resets at the start of each turn

### Examples

#### Melee Card at (1,1)
Can move to:
- (0,1) - up
- (2,1) - down
- (1,0) - left
- (1,2) - right
**Total: 4 possible moves**

#### Ranged/Hybrid Card at (1,1)
Can move to:
- All melee positions, plus:
- (0,0), (0,2) - 2 cells diagonally
- Any position 2 cells away in cardinal directions
**Total: Up to 8 possible moves**

---

## Zone Effects on Combat

### Left Flank (Column 0)
- **Melee**: +20% attack, -10% defense (aggressive positioning)
- **Ranged**: -20% attack, -10% defense (poor angle)
- **Hybrid**: No attack modifier, -10% defense

### Center (Column 1)
- **All types**: No modifiers (neutral ground - contested zone)

### Right Flank (Column 2)
- **Melee**: -20% attack, +10% defense (defensive positioning)
- **Ranged**: +15% attack, +10% defense (perfect angle)
- **Hybrid**: No attack modifier, +10% defense

---

## Attack Range Rules

### Card vs Card Attacks

#### Melee Cards
- Can only attack **adjacent columns** (col ±1)
- Must be within 1 column of target

#### Ranged Cards
- Can attack **any column**
- No range restrictions

#### Hybrid Cards
- Can attack **any column**
- Full battlefield coverage

---

### Castle Attack Rules

#### Melee Cards
- **Must be in center column (col 1)** to attack enemy castle
- The center is the contested "no man's land" where melee combat reaches both sides
- Cannot attack castle from their home columns (col 0 for P1, col 2 for P2)

#### Ranged Cards
- Can attack castle from **any column**
- No position restrictions
- Can siege from safe back positions

#### Hybrid Cards
- Can attack castle from **any column**
- Full battlefield access

**Strategic Impact**:
- Melee cards must **control the center** to damage castles
- This creates natural chokepoint battles over column 1
- Ranged units can siege from safety while melee fights for center control
- Encourages tactical positioning and zone control

---

## Tactical Considerations

### Opening Strategy
1. **Player 1 (Left)** should consider:
   - Deploy melee cards to left flank (col 0) for attack bonus
   - Use center (col 1) for flexible positioning
   - Control left side aggressively

2. **Player 2 (Right)** should consider:
   - Deploy ranged units to right flank (col 2) for bonus
   - Use center (col 1) as buffer zone
   - Counter-attack with positioned ranged units

### Mid-Game Movement
- **Melee cards** can reposition 1 cell to adjust formation
- **Ranged cards** can retreat 2 cells for safety
- **Hybrid cards** provide flexible repositioning

### Late-Game Positioning
- Control of **center (column 1)** becomes critical
- Zone bonuses can swing damage calculations
- Movement allows dynamic response to threats
- Push melee to enemy flank for castle damage

---

## Implementation Details

### Helper Functions (BattleEngine)

```typescript
// Check deployment zone restrictions
BattleEngine.canDeployToPosition(position, playerId, state): boolean

// Get all valid deployment positions for a player
BattleEngine.getValidDeploymentPositions(playerId, state): Position[]

// Check movement range
BattleEngine.canMoveToPosition(card, toPosition): boolean

// Get all valid movement positions for a card
BattleEngine.getValidMovementPositions(card, state): Position[]
```

### Usage in AI
The Consciousness AI system now uses these helpers:
- `getValidDeploymentPositions()` replaces manual empty cell checking
- `getValidMovementPositions()` ensures movement respects range rules
- Zone bonuses are automatically calculated in damage formulas

---

## Future Enhancements

### Potential Additions
1. **Advanced Movement**
   - Speed-based movement (high speed = +1 range)
   - Flying units ignore zone restrictions
   - Charge ability (move + attack in one turn)

2. **Zone Control**
   - Domination bonuses for controlling multiple zones
   - Terrain effects per zone
   - Dynamic zone ownership

3. **Formation-Based Movement**
   - Group movement for formations
   - Movement penalties/bonuses based on formation
   - Retreat formations (defensive repositioning)

---

## Testing Checklist

- [x] AI respects deployment zone restrictions
- [x] Melee cards limited to 1-cell movement
- [x] Ranged/Hybrid cards can move 2 cells
- [x] Zone bonuses apply correctly
- [x] Attack range restrictions enforced
- [ ] Human player UI shows valid zones
- [ ] Movement preview highlights valid cells
- [ ] Zone indicators visible on battlefield

---

*Created for Tasern Siegefront - October 2025*
*Part of the Tales of Tasern D&D Universe*
