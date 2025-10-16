/**
 * Debug Panel - Live State Inspector
 *
 * Shows real-time battle state for debugging multiplayer sync issues.
 * Can be toggled on/off with a hotkey or button.
 */

import React, { useState } from 'react';
import { useBattleStore, selectBattleState, selectLocalPlayerId, selectIsMultiplayer } from '../state/battleStore';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SPACING, TASERN_BORDERS } from '../styles/tasernTheme';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const battleState = useBattleStore(selectBattleState);
  const localPlayerId = useBattleStore(selectLocalPlayerId);
  const isMultiplayer = useBattleStore(selectIsMultiplayer);

  if (!battleState) {
    return null;
  }

  // Count cards on battlefield
  const cardsOnBattlefield = battleState.battlefield.flat().filter(c => c !== null);
  const player1Cards = cardsOnBattlefield.filter(c => c?.ownerId === Object.keys(battleState.players)[0]);
  const player2Cards = cardsOnBattlefield.filter(c => c?.ownerId === Object.keys(battleState.players)[1]);

  const players = Object.values(battleState.players);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.toggleButton,
          bottom: isOpen ? '320px' : '20px',
        }}
      >
        {isOpen ? '📊 Hide Debug' : '🔍 Debug'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div style={styles.panel}>
          <h3 style={styles.title}>🔍 Live Battle State</h3>

          {/* Multiplayer Info */}
          {isMultiplayer && (
            <div style={styles.section}>
              <div style={styles.label}>Multiplayer Mode</div>
              <div style={styles.value}>Local Player: {localPlayerId}</div>
            </div>
          )}

          {/* Battle Info */}
          <div style={styles.section}>
            <div style={styles.label}>Battle ID</div>
            <div style={styles.valueSmall}>{battleState.id}</div>
          </div>

          <div style={styles.row}>
            <div style={styles.section}>
              <div style={styles.label}>Turn</div>
              <div style={styles.value}>{battleState.currentTurn}</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Phase</div>
              <div style={styles.value}>{battleState.phase}</div>
            </div>
          </div>

          {/* Active Player */}
          <div style={styles.section}>
            <div style={styles.label}>Active Player</div>
            <div style={styles.value}>
              {battleState.players[battleState.activePlayerId]?.name}
              <span style={styles.valueSmall}> ({battleState.activePlayerId})</span>
            </div>
          </div>

          {/* Player States */}
          <div style={styles.row}>
            {players.map((player, idx) => (
              <div key={player.id} style={styles.playerBox}>
                <div style={styles.playerName}>
                  {player.name}
                  {localPlayerId === player.id && ' (YOU)'}
                </div>
                <div style={styles.stat}>HP: {player.castleHp}/{player.maxCastleHp}</div>
                <div style={styles.stat}>Mana: {player.mana}/{player.maxMana}</div>
                <div style={styles.stat}>Hand: {player.hand.length}</div>
                <div style={styles.stat}>Deck: {player.deck.length}</div>
                <div style={styles.stat}>
                  Cards: {idx === 0 ? player1Cards.length : player2Cards.length}
                </div>
              </div>
            ))}
          </div>

          {/* Battlefield Summary */}
          <div style={styles.section}>
            <div style={styles.label}>Battlefield</div>
            <div style={styles.battlefieldGrid}>
              {battleState.battlefield.map((row, rowIdx) => (
                <div key={rowIdx} style={styles.battlefieldRow}>
                  {row.map((cell, colIdx) => (
                    <div
                      key={colIdx}
                      style={{
                        ...styles.battlefieldCell,
                        backgroundColor: cell
                          ? cell.ownerId === Object.keys(battleState.players)[0]
                            ? 'rgba(6, 95, 70, 0.3)'
                            : 'rgba(139, 0, 0, 0.3)'
                          : 'rgba(107, 114, 128, 0.2)',
                      }}
                    >
                      {cell ? `${cell.name.slice(0, 8)}...` : '—'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Last 3 Battle Log Entries */}
          <div style={styles.section}>
            <div style={styles.label}>Recent Actions</div>
            <div style={styles.logContainer}>
              {battleState.battleLog.slice(-3).reverse().map((entry, idx) => (
                <div key={idx} style={styles.logEntry}>
                  <span style={styles.logTurn}>T{entry.turn}</span>
                  <span style={styles.logAction}>{entry.action}</span>
                  <span style={styles.logResult}>{entry.result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weather */}
          {battleState.weather && (
            <div style={styles.section}>
              <div style={styles.label}>Weather</div>
              <div style={styles.value}>
                {battleState.weather.type} ({battleState.weather.turnsRemaining} turns)
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toggleButton: {
    position: 'fixed',
    right: '20px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.9) 0%, rgba(92, 64, 51, 0.9) 100%)',
    border: `2px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    color: TASERN_COLORS.parchment,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '14px',
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  panel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '400px',
    maxHeight: '300px',
    overflowY: 'auto',
    background: 'linear-gradient(135deg, rgba(26, 20, 16, 0.95) 0%, rgba(58, 42, 26, 0.95) 100%)',
    border: `3px solid ${TASERN_COLORS.gold}`,
    borderRadius: '12px',
    padding: TASERN_SPACING.lg,
    zIndex: 1000,
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    fontFamily: TASERN_TYPOGRAPHY.body,
    color: TASERN_COLORS.parchment,
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: TASERN_SPACING.md,
    borderBottom: `2px solid ${TASERN_COLORS.bronze}`,
    paddingBottom: TASERN_SPACING.sm,
  },
  section: {
    marginBottom: TASERN_SPACING.md,
  },
  row: {
    display: 'flex',
    gap: TASERN_SPACING.md,
    marginBottom: TASERN_SPACING.md,
  },
  label: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '12px',
    color: TASERN_COLORS.bronze,
    textTransform: 'uppercase',
    marginBottom: TASERN_SPACING.xs,
  },
  value: {
    fontSize: '14px',
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
  },
  valueSmall: {
    fontSize: '11px',
    color: TASERN_COLORS.stone,
    fontFamily: 'monospace',
  },
  playerBox: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.3)',
    border: `1px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '6px',
    padding: TASERN_SPACING.sm,
  },
  playerName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '13px',
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.xs,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
  },
  stat: {
    fontSize: '11px',
    color: TASERN_COLORS.parchment,
    marginBottom: '2px',
  },
  battlefieldGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  battlefieldRow: {
    display: 'flex',
    gap: '4px',
  },
  battlefieldCell: {
    flex: 1,
    padding: '6px',
    border: `1px solid ${TASERN_COLORS.stone}`,
    borderRadius: '4px',
    fontSize: '10px',
    textAlign: 'center',
    fontFamily: 'monospace',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  logEntry: {
    display: 'flex',
    gap: TASERN_SPACING.sm,
    fontSize: '11px',
    padding: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
  },
  logTurn: {
    color: TASERN_COLORS.bronze,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    minWidth: '30px',
  },
  logAction: {
    color: TASERN_COLORS.blue,
    minWidth: '100px',
  },
  logResult: {
    color: TASERN_COLORS.parchment,
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
};
