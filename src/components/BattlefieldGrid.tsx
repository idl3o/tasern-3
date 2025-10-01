/**
 * BattlefieldGrid Component
 *
 * 3x3 tactical battlefield with formation visualization.
 * Shows cards, empty slots, and zone control.
 *
 * Philosophy: Pure presentation. Actions dispatched to store.
 */

import React from 'react';
import type { Battlefield, Position, BattleCard } from '../types/core';
import { CardDisplay } from './CardDisplay';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';

interface BattlefieldGridProps {
  battlefield: Battlefield;
  playerNames: Record<string, string>;
  onCellClick?: (position: Position, card: BattleCard | null) => void;
  highlightedPositions?: Position[];
}

export const BattlefieldGrid: React.FC<BattlefieldGridProps> = ({
  battlefield,
  playerNames,
  onCellClick,
  highlightedPositions = [],
}) => {
  const isHighlighted = (row: number, col: number): boolean => {
    return highlightedPositions.some((pos) => pos.row === row && pos.col === col);
  };

  const getZoneLabel = (row: number): string => {
    if (row === 0) return 'Front Line';
    if (row === 1) return 'Mid Field';
    return 'Back Line';
  };

  return (
    <div style={styles.container}>
      {/* Zone Labels */}
      <div style={styles.zoneLabels}>
        {[0, 1, 2].map((row) => (
          <div key={row} style={styles.zoneLabel}>
            {getZoneLabel(row)}
          </div>
        ))}
      </div>

      {/* Battlefield Grid */}
      <div style={styles.grid}>
        {battlefield.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((card, colIndex) => {
              const position: Position = { row: rowIndex, col: colIndex };
              const highlighted = isHighlighted(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    ...styles.cell,
                    ...(highlighted ? styles.cellHighlighted : {}),
                    ...(card ? styles.cellOccupied : styles.cellEmpty),
                  }}
                  onClick={() => onCellClick?.(position, card)}
                >
                  {card ? (
                    <CardDisplay
                      card={card}
                      isOnBattlefield={true}
                      ownerName={playerNames[card.ownerId]}
                    />
                  ) : (
                    <div style={styles.emptySlot}>
                      <span style={styles.positionLabel}>
                        {rowIndex},{colIndex}
                      </span>
                      <span style={styles.emptyIcon}>⬜</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Formation Legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>Formations</div>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>⚔️ Vanguard: Front row +20% ATK</div>
          <div style={styles.legendItem}>🛡️ Phalanx: Line +30% DEF</div>
          <div style={styles.legendItem}>🏹 Archer: Back row +15% ATK</div>
          <div style={styles.legendItem}>🦅 Flanking: Sides +15% SPD</div>
          <div style={styles.legendItem}>🏰 Siege: Enemy zone +25% ATK</div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.lg,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: TASERN_BORDERS.radiusLarge,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.stone}`,
  },
  zoneLabels: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: TASERN_SPACING.sm,
    gap: '210px',
    marginTop: '85px',
  },
  zoneLabel: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    opacity: 0.7,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.md,
    marginLeft: '60px',
  },
  row: {
    display: 'flex',
    gap: TASERN_SPACING.md,
    justifyContent: 'center',
  },
  cell: {
    width: '220px',
    height: '320px',
    borderRadius: TASERN_BORDERS.radiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  cellEmpty: {
    background: 'rgba(107, 114, 128, 0.2)',
    border: `${TASERN_BORDERS.widthThin} dashed ${TASERN_COLORS.stone}`,
  },
  cellOccupied: {
    background: 'transparent',
  },
  cellHighlighted: {
    background: 'rgba(212, 175, 55, 0.3)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  emptySlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: TASERN_SPACING.sm,
    opacity: 0.5,
  },
  positionLabel: {
    fontFamily: TASERN_TYPOGRAPHY.monospace,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.stone,
  },
  emptyIcon: {
    fontSize: '3rem',
    opacity: 0.3,
  },
  legend: {
    marginTop: TASERN_SPACING.md,
    padding: TASERN_SPACING.md,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  legendTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.sm,
    textAlign: 'center',
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: TASERN_SPACING.sm,
    justifyContent: 'center',
  },
  legendItem: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.parchment,
    padding: TASERN_SPACING.xs,
    background: 'rgba(139, 105, 20, 0.3)',
    borderRadius: TASERN_BORDERS.radiusSmall,
  },
};
