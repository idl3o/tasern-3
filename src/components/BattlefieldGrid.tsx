/**
 * BattlefieldGrid Component
 *
 * 3x3 tactical battlefield with formation visualization.
 * Shows cards, empty slots, and zone control.
 *
 * Philosophy: Pure presentation. Actions dispatched to store.
 */

import React from 'react';
import type { Battlefield, Position, BattleCard, GridConfig, MapTheme } from '../types/core';
import { MAP_THEMES } from '../types/core';
import { CardDisplay } from './CardDisplay';
import { FormationCalculator } from '../core/FormationCalculator';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';

interface BattlefieldGridProps {
  battlefield: Battlefield;
  gridConfig: GridConfig;
  mapTheme: MapTheme;
  blockedTiles: Position[];
  playerNames: Record<string, string>;
  onCellClick?: (position: Position, card: BattleCard | null) => void;
  onCardInspect?: (card: BattleCard) => void;
  highlightedPositions?: Position[];
  validDropZones?: Position[];
  availableSpaces?: Position[]; // All empty spaces available for deployment
}

export const BattlefieldGrid: React.FC<BattlefieldGridProps> = ({
  battlefield,
  gridConfig,
  mapTheme,
  blockedTiles,
  playerNames,
  onCellClick,
  onCardInspect,
  highlightedPositions = [],
  validDropZones = [],
  availableSpaces = [],
}) => {
  const themeData = MAP_THEMES[mapTheme];

  // Get active formations for each player
  const getActiveFormations = () => {
    const allCards = battlefield.flat().filter((c) => c !== null) as BattleCard[];
    const playerFormations: Record<string, string> = {};

    // Group cards by owner
    const cardsByOwner: Record<string, BattleCard[]> = {};
    allCards.forEach((card) => {
      if (!cardsByOwner[card.ownerId]) {
        cardsByOwner[card.ownerId] = [];
      }
      cardsByOwner[card.ownerId].push(card);
    });

    // Calculate formation for each player (just need one card per player)
    Object.keys(cardsByOwner).forEach((ownerId) => {
      const cards = cardsByOwner[ownerId];
      if (cards.length > 0) {
        const formation = FormationCalculator.calculateFormationBonus(cards[0], battlefield);
        playerFormations[ownerId] = formation.type;
      }
    });

    return playerFormations;
  };

  const activeFormations = getActiveFormations();

  // Get formation display info
  const getFormationDisplay = (type: string) => {
    const displays: Record<string, { icon: string; name: string; bonus: string }> = {
      VANGUARD: { icon: '⚔️', name: 'Vanguard', bonus: '+20% ATK' },
      PHALANX: { icon: '🛡️', name: 'Phalanx', bonus: '+30% DEF' },
      ARCHER_LINE: { icon: '🏹', name: 'Archer', bonus: '+15% ATK' },
      FLANKING: { icon: '🦅', name: 'Flanking', bonus: '+15% SPD' },
      SIEGE: { icon: '🏰', name: 'Siege', bonus: '+25% ATK' },
      SKIRMISH: { icon: '⚡', name: 'Skirmish', bonus: '+5% SPD' },
    };
    return displays[type] || displays.SKIRMISH;
  };

  const isHighlighted = (row: number, col: number): boolean => {
    return highlightedPositions.some((pos) => pos.row === row && pos.col === col);
  };

  const isBlocked = (row: number, col: number): boolean => {
    return blockedTiles.some((pos) => pos.row === row && pos.col === col);
  };

  const isValidDropZone = (row: number, col: number): boolean => {
    return validDropZones.some((pos) => pos.row === row && pos.col === col);
  };

  const isAvailableSpace = (row: number, col: number): boolean => {
    return availableSpaces.some((pos) => pos.row === row && pos.col === col);
  };

  const getZoneLabel = (row: number, totalRows: number): string => {
    if (row === 0) return 'Front Line';
    if (row === totalRows - 1) return 'Back Line';
    if (totalRows === 2) return ''; // No middle for 2-row grids
    if (totalRows === 3) return 'Mid Field';
    // For larger grids, label middle rows
    const middle = Math.floor(totalRows / 2);
    if (row === middle) return 'Center';
    if (row < middle) return `Forward ${row}`;
    return `Rear ${totalRows - row - 1}`;
  };

  // Calculate dynamic cell sizes based on grid dimensions
  const getCellStyle = (): React.CSSProperties => {
    // Adjust cell size based on grid dimensions to fit available space
    const baseCellWidth = 220;
    const baseCellHeight = 280;

    // More aggressive scaling for larger grids
    const widthScale = Math.max(0.4, 1 - (gridConfig.cols - 3) * 0.2);
    const heightScale = Math.max(0.4, 1 - (gridConfig.rows - 3) * 0.2);

    const cellWidth = Math.floor(baseCellWidth * widthScale);
    const cellHeight = Math.floor(baseCellHeight * heightScale);

    return {
      width: `min(${14 * widthScale}vw, ${cellWidth}px)`,
      height: `min(${18 * heightScale}vh, ${cellHeight}px)`,
    };
  };

  const zoneLabelGap = `calc(min(${16 * Math.max(0.5, 1 - (gridConfig.rows - 3) * 0.15)}vh, ${Math.floor(240 * Math.max(0.5, 1 - (gridConfig.rows - 3) * 0.15))}px) + 0.75rem)`;

  return (
    <div className="battlefield-grid" style={{
      ...styles.container,
      background: `linear-gradient(135deg, ${themeData.backgroundColor} 0%, rgba(0, 0, 0, 0.8) 100%)`,
      border: `${TASERN_BORDERS.widthMedium} solid ${themeData.borderColor}`,
    }}>
      {/* Zone Labels - Hidden per user request */}
      <div className="zone-labels" style={{ ...styles.zoneLabels, gap: zoneLabelGap, display: 'none' }}>
        {Array.from({ length: gridConfig.rows }).map((_, row) => (
          <div key={row} style={styles.zoneLabel}>
            {getZoneLabel(row, gridConfig.rows)}
          </div>
        ))}
      </div>

      {/* Grid Info */}
      <div className="grid-info" style={{
        ...styles.gridInfo,
        color: themeData.accentColor,
      }}>
        {themeData.icon} {gridConfig.name} {themeData.icon}
      </div>

      {/* Active Formations Indicator */}
      {Object.keys(activeFormations).length > 0 && (
        <div style={styles.formationsIndicator}>
          {Object.entries(activeFormations).map(([ownerId, formationType]) => {
            const display = getFormationDisplay(formationType);
            const playerName = playerNames[ownerId] || 'Unknown';
            return (
              <div key={ownerId} style={styles.formationBadge}>
                <span style={styles.formationIcon}>{display.icon}</span>
                <span style={styles.formationText}>
                  {playerName}: {display.name} {display.bonus}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Battlefield Grid */}
      <div style={styles.grid}>
        {battlefield.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((card, colIndex) => {
              const position: Position = { row: rowIndex, col: colIndex };
              const highlighted = isHighlighted(rowIndex, colIndex);
              const blocked = isBlocked(rowIndex, colIndex);
              const validDrop = isValidDropZone(rowIndex, colIndex);
              const available = isAvailableSpace(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`battlefield-cell ${validDrop ? 'valid-drop-zone' : ''} ${available ? 'available-space' : ''}`}
                  style={{
                    ...styles.cell,
                    ...getCellStyle(),
                    ...(highlighted ? styles.cellHighlighted : {}),
                    ...(available && !validDrop ? styles.cellAvailable : {}),
                    ...(blocked ? {
                      ...styles.cellBlocked,
                      background: `linear-gradient(135deg, ${themeData.cellColor} 0%, ${themeData.backgroundColor} 100%)`,
                      border: `${TASERN_BORDERS.widthMedium} solid ${themeData.borderColor}`,
                    } : card ? styles.cellOccupied : {
                      ...styles.cellEmpty,
                      background: `rgba(107, 114, 128, 0.2)`,
                      border: `${TASERN_BORDERS.widthThin} dashed ${themeData.borderColor}`,
                    }),
                  }}
                  onClick={() => !blocked && onCellClick?.(position, card)}
                >
                  {blocked ? (
                    <div style={styles.blockedSlot}>
                      <span style={styles.obstacleIcon}>{themeData.icon}</span>
                      <span style={styles.obstacleText}>BLOCKED</span>
                    </div>
                  ) : card ? (
                    <CardDisplay
                      card={card}
                      isOnBattlefield={true}
                      ownerName={playerNames[card.ownerId]}
                      onInspect={() => onCardInspect?.(card)}
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

      {/* Formation Legend - Hidden to save space */}
      {/* TODO: Replace with compact active formation indicator */}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.md,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: TASERN_BORDERS.radiusLarge,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.stone}`,
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInfo: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: TASERN_SPACING.sm,
    textShadow: TASERN_SHADOWS.textGold,
  },
  formationsIndicator: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.xs,
    marginBottom: TASERN_SPACING.sm,
    alignItems: 'center',
  },
  formationBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: TASERN_SPACING.xs,
    padding: TASERN_SPACING.xs,
    background: 'rgba(139, 105, 20, 0.3)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
  },
  formationIcon: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
  },
  formationText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    color: TASERN_COLORS.parchment,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
  },
  zoneLabels: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: TASERN_SPACING.sm,
    // Dynamic gap that scales with cell height + gap between rows
    gap: 'calc(min(22vh, 320px) + 1rem)',
    // Dynamic margin-top to align with first row
    marginTop: 'calc(min(5vh, 85px))',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    display: 'flex',
    gap: TASERN_SPACING.md,
    justifyContent: 'center',
  },
  cell: {
    // Dynamic dimensions applied via getCellStyle()
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
  cellAvailable: {
    background: 'rgba(139, 105, 20, 0.15)',
    border: `${TASERN_BORDERS.widthThin} solid rgba(212, 175, 55, 0.4)`,
    cursor: 'pointer',
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
  cellBlocked: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  blockedSlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TASERN_SPACING.sm,
    width: '100%',
    height: '100%',
  },
  obstacleIcon: {
    fontSize: '4rem',
    opacity: 0.8,
    filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))',
  },
  obstacleText: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.6,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  },
};
