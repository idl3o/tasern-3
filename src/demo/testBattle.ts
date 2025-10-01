/**
 * Test Battle - Consciousness vs Consciousness
 *
 * A simple demo to watch AI personalities battle each other.
 * No UI needed - pure console output to validate the engine.
 */

import type { Player } from '../types/core';
import { BattleEngine } from '../core/BattleEngine';
import { AIStrategy } from '../strategies/AIStrategy';
import { LADY_SWIFTBLADE, THORNWICK_THE_TACTICIAN } from '../ai/personalities';

/**
 * Create a test AI player
 */
function createAIPlayer(id: string, name: string, personality: any): Player {
  return {
    id,
    name,
    type: 'ai',
    castleHp: 30,
    maxCastleHp: 30,
    mana: 10,
    maxMana: 10,
    hand: [],
    deck: [],
    strategy: new AIStrategy(),
    lpBonus: 0,
    aiPersonality: personality,
  };
}

/**
 * Run a full battle simulation
 */
export async function runTestBattle() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🏰 TASERN SIEGEFRONT - CONSCIOUSNESS TEST BATTLE 🏰');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');

  // Create players
  const player1 = createAIPlayer('ai-1', 'Lady Swiftblade', LADY_SWIFTBLADE);
  const player2 = createAIPlayer('ai-2', 'Thornwick', THORNWICK_THE_TACTICIAN);

  console.log(`⚔️  ${player1.name} (${player1.aiPersonality?.title})`);
  console.log(`     Aggression: ${player1.aiPersonality?.aggression}`);
  console.log(`     Creativity: ${player1.aiPersonality?.creativity}`);
  console.log(`     Risk Tolerance: ${player1.aiPersonality?.riskTolerance}`);
  console.log('\n     VS\n');
  console.log(`⚔️  ${player2.name} (${player2.aiPersonality?.title})`);
  console.log(`     Aggression: ${player2.aiPersonality?.aggression}`);
  console.log(`     Patience: ${player2.aiPersonality?.patience}`);
  console.log(`     Adaptability: ${player2.aiPersonality?.adaptability}`);
  console.log('\n');

  // Initialize battle
  let state = BattleEngine.initializeBattle(player1, player2);

  console.log('Battle begins!\n');

  // Battle loop
  const maxTurns = 20; // Limit for demo
  let turnCount = 0;

  while (turnCount < maxTurns) {
    turnCount++;

    const activePlayer = state.players[state.activePlayerId];
    if (!activePlayer) {
      console.error('❌ Active player not found');
      break;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TURN ${state.currentTurn} - ${activePlayer.name}'s Turn`);
    console.log(`${'='.repeat(60)}`);

    const p1State = state.players[player1.id];
    const p2State = state.players[player2.id];

    if (!p1State || !p2State) {
      console.error('❌ Player state corrupted');
      break;
    }

    console.log(`\n📊 Status:`);
    console.log(`   ${player1.name}: ${p1State.castleHp} HP | ${p1State.mana} Mana`);
    console.log(`   ${player2.name}: ${p2State.castleHp} HP | ${p2State.mana} Mana`);

    // Print battlefield
    console.log('\n🗺️  Battlefield:');
    printBattlefield(state.battlefield);

    // AI takes action
    if (activePlayer.type === 'ai') {
      console.log(`\n🤖 ${activePlayer.name} is thinking...`);

      try {
        const action = await activePlayer.strategy.selectAction(activePlayer, state);
        console.log(`\n✅ ${activePlayer.name} chose: ${action.type}`);

        state = BattleEngine.executeAction(state, action);

        // Check victory
        const victory = BattleEngine.checkVictoryConditions(state);
        if (victory) {
          const winner = state.players[victory.winnerId];
          console.log('\n');
          console.log('═'.repeat(60));
          console.log(`🏆 VICTORY! ${winner?.name || 'Unknown'} WINS!`);
          console.log(`   Condition: ${victory.condition}`);
          console.log(`   Turn: ${victory.turn}`);
          console.log('═'.repeat(60));
          console.log('\n');
          break;
        }
      } catch (error) {
        console.error('❌ AI error:', error);
        break;
      }
    }

    // End turn
    console.log(`\n⏭️  Ending ${activePlayer.name}'s turn...`);
    state = BattleEngine.endTurn(state);

    // Small delay between turns for readability
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (turnCount >= maxTurns) {
    console.log('\n⏱️  Turn limit reached. Battle ends.\n');

    // Determine winner by castle HP
    const p1Hp = state.players[player1.id]?.castleHp || 0;
    const p2Hp = state.players[player2.id]?.castleHp || 0;

    if (p1Hp > p2Hp) {
      console.log(`🏆 ${player1.name} wins with ${p1Hp} HP remaining!`);
    } else if (p2Hp > p1Hp) {
      console.log(`🏆 ${player2.name} wins with ${p2Hp} HP remaining!`);
    } else {
      console.log('🤝 Draw!');
    }
  }

  console.log('\n📜 Battle Log:');
  state.battleLog.slice(-10).forEach((entry) => {
    console.log(`   [T${entry.turn}] ${entry.result}`);
  });

  console.log('\n✨ Test battle complete!\n');
}

/**
 * Print battlefield state
 */
function printBattlefield(battlefield: any[][]) {
  console.log('   ┌─────────┬─────────┬─────────┐');

  for (let row = 0; row < 3; row++) {
    let line = '   │';

    for (let col = 0; col < 3; col++) {
      const card = battlefield[row]?.[col];

      if (card) {
        const shortName = card.name.substring(0, 7).padEnd(7);
        const icon = card.ownerId === 'ai-1' ? '⚔️' : '🛡️';
        line += ` ${icon}${shortName}│`;
      } else {
        line += '         │';
      }
    }

    console.log(line);

    if (row < 2) {
      console.log('   ├─────────┼─────────┼─────────┤');
    }
  }

  console.log('   └─────────┴─────────┴─────────┘');
}

// Run if executed directly
if (require.main === module) {
  runTestBattle().catch(console.error);
}
