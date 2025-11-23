/**
 * BattleControls Component
 *
 * Turn controls, AI thinking indicator, and battle log display.
 * Medieval D&D buttons with bronze and gold.
 *
 * Philosophy: Pure presentation. Actions dispatched to store.
 */

import React from 'react';
import type { BattleLogEntry, Player } from '../types/core';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';

interface BattleControlsProps {
  activePlayer: Player;
  isProcessing: boolean;
  currentTurn: number;
  battleLog: BattleLogEntry[];
  onEndTurn?: () => void;
  onSurrender?: () => void;
}

export const BattleControls: React.FC<BattleControlsProps> = ({
  activePlayer,
  isProcessing,
  currentTurn,
  battleLog,
  onEndTurn,
  onSurrender,
}) => {
  return (
    <div className="battle-controls-container" style={styles.container}>
      {/* Turn Info */}
      <div className="turn-info" style={styles.turnInfo}>
        <div style={styles.turnLabel}>Turn {currentTurn}</div>
        <div style={styles.activePlayerName}>
          {activePlayer.name}
          {activePlayer.type === 'ai' ? ' 🤖' : ' 👤'}
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {activePlayer.type === 'human' && (
          <>
            <button
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isProcessing ? styles.buttonDisabled : {}),
              }}
              onClick={onEndTurn}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳ Processing...' : '⏭️ End Turn'}
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isProcessing ? styles.buttonDisabled : {}),
              }}
              onClick={onSurrender}
              disabled={isProcessing}
            >
              🏳️ Surrender
            </button>
          </>
        )}

        {activePlayer.type === 'ai' && (
          <div style={styles.aiThinking}>
            <div style={styles.aiThinkingIcon}>🧠</div>
            <div style={styles.aiThinkingText}>
              <div style={styles.aiName}>{activePlayer.name} is thinking...</div>
              {activePlayer.aiPersonality && (
                <div style={styles.aiPersonality}>
                  {activePlayer.aiPersonality.title}
                </div>
              )}
            </div>
            <div style={styles.spinner}>⚙️</div>
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="log-container" style={styles.logContainer}>
        <div className="log-title" style={styles.logTitle}>⚔️ Battle Log</div>
        <div className="log-content" style={styles.logContent}>
          {battleLog.length === 0 ? (
            <div style={styles.logEmpty}>Battle begins...</div>
          ) : (
            battleLog.slice(-8).reverse().map((entry, idx) => (
              <div
                key={`${entry.turn}-${idx}`}
                style={{
                  ...styles.logEntry,
                  ...(idx === 0 ? styles.logEntryLatest : {}),
                }}
              >
                <span style={styles.logTurn}>T{entry.turn}</span>
                <span style={styles.logAction}>{entry.action}</span>
                {entry.result && (
                  <span style={styles.logResult}>{entry.result}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.sm,
    padding: TASERN_SPACING.md,
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(26, 20, 16, 0.9) 100%)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    fontFamily: TASERN_TYPOGRAPHY.body,
    color: TASERN_COLORS.parchment,
    minWidth: '260px', // Reduced from 400px
    boxShadow: TASERN_SHADOWS.medium,
    flex: '1 1 auto', // Allow to grow and shrink
  },
  turnInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: TASERN_SPACING.sm,
    borderBottom: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  turnLabel: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  activePlayerName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
  controls: {
    display: 'flex',
    gap: TASERN_SPACING.sm,
    flexWrap: 'wrap',
  },
  button: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.md} ${TASERN_SPACING.xl}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthMedium} solid`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  buttonPrimary: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    borderColor: TASERN_COLORS.gold,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.medium,
  },
  buttonSecondary: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.8) 0%, rgba(92, 64, 51, 0.8) 100%)',
    borderColor: TASERN_COLORS.red,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.soft,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
  aiThinking: {
    display: 'flex',
    alignItems: 'center',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.md,
    background: 'rgba(91, 33, 182, 0.2)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.purple}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    flex: 1,
  },
  aiThinkingIcon: {
    fontSize: '2rem',
  },
  aiThinkingText: {
    flex: 1,
  },
  aiName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.purple,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    marginBottom: TASERN_SPACING.xs,
  },
  aiPersonality: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  spinner: {
    fontSize: '1.5rem',
    animation: 'spin 2s linear infinite',
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: TASERN_SPACING.sm,
  },
  logTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    marginBottom: TASERN_SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  logContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.xs,
    maxHeight: '180px', // Reduced from 300px to fit better
    overflowY: 'auto',
    padding: TASERN_SPACING.sm,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.stone}`,
  },
  logEmpty: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.stone,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: TASERN_SPACING.md,
  },
  logEntry: {
    display: 'flex',
    gap: TASERN_SPACING.sm,
    padding: TASERN_SPACING.xs,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    borderRadius: TASERN_BORDERS.radiusSmall,
    transition: 'background 0.3s ease',
  },
  logEntryLatest: {
    background: 'rgba(212, 175, 55, 0.2)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.gold}`,
  },
  logTurn: {
    fontFamily: TASERN_TYPOGRAPHY.monospace,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    minWidth: '30px',
  },
  logAction: {
    flex: 1,
    color: TASERN_COLORS.parchment,
  },
  logResult: {
    color: TASERN_COLORS.green,
    fontStyle: 'italic',
  },
};
