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
  highlightedPositions?: Position[];
  validDropZones?: Position[];
}

export const BattlefieldGrid: React.FC<BattlefieldGridProps> = ({
  battlefield,
  gridConfig,
  mapTheme,
  blockedTiles,
  playerNames,
  onCellClick,
  highlightedPositions = [],
  validDropZones = [],
}) => {
  const themeData = MAP_THEMES[mapTheme];

  const isHighlighted = (row: number, col: number): boolean => {
    return highlightedPositions.some((pos) => pos.row === row && pos.col === col);
  };

  const isBlocked = (row: number, col: number): boolean => {
    return blockedTiles.some((pos) => pos.row === row && pos.col === col);
  };

  const isValidDropZone = (row: number, col: number): boolean => {
    return validDropZones.some((pos) => pos.row === row && pos.col === col);
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
    // Adjust cell size based on grid dimensions
    // Smaller cells for larger grids
    const baseCellWidth = 220;
    const baseCellHeight = 320;

    const widthScale = Math.max(0.5, 1 - (gridConfig.cols - 3) * 0.15);
    const heightScale = Math.max(0.5, 1 - (gridConfig.rows - 3) * 0.15);

    const cellWidth = Math.floor(baseCellWidth * widthScale);
    const cellHeight = Math.floor(baseCellHeight * heightScale);

    return {
      width: `min(${15 * widthScale}vw, ${cellWidth}px)`,
      height: `min(${22 * heightScale}vh, ${cellHeight}px)`,
    };
  };

  const zoneLabelGap = `calc(min(${22 * Math.max(0.5, 1 - (gridConfig.rows - 3) * 0.15)}vh, ${Math.floor(320 * Math.max(0.5, 1 - (gridConfig.rows - 3) * 0.15))}px) + 1rem)`;

  return (
    <div className="battlefield-grid" style={{
      ...styles.container,
      background: `linear-gradient(135deg, ${themeData.backgroundColor} 0%, rgba(0, 0, 0, 0.8) 100%)`,
      border: `${TASERN_BORDERS.widthMedium} solid ${themeData.borderColor}`,
    }}>
      {/* Zone Labels */}
      <div className="zone-labels" style={{ ...styles.zoneLabels, gap: zoneLabelGap }}>
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

      {/* Battlefield Grid */}
      <div style={styles.grid}>
        {battlefield.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((card, colIndex) => {
              const position: Position = { row: rowIndex, col: colIndex };
              const highlighted = isHighlighted(rowIndex, colIndex);
              const blocked = isBlocked(rowIndex, colIndex);
              const validDrop = isValidDropZone(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`battlefield-cell ${validDrop ? 'valid-drop-zone' : ''}`}
                  style={{
                    ...styles.cell,
                    ...getCellStyle(),
                    ...(highlighted ? styles.cellHighlighted : {}),
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
      <div className="legend formation-legend" style={styles.legend}>
        <div className="legend-title" style={styles.legendTitle}>Formations</div>
        <div className="legend-items legend-content" style={styles.legendItems}>
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
    // Responsive margin for zone labels
    marginLeft: 'clamp(40px, 4vw, 60px)',
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
