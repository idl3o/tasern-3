/**
 * Tutorial Overlay Component
 *
 * Quick onboarding guide for new players
 */

import React, { useState } from 'react';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS } from '../styles/tasernTheme';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Tasern Siegefront!',
      content: (
        <>
          <p>A tactical card battle game set in the <strong>Tales of Tasern</strong> D&D universe.</p>
          <p>Face off against AI opponents with distinct personalities, challenge a friend locally, or battle online via invite codes!</p>
        </>
      ),
    },
    {
      title: 'Getting Into Battle',
      content: (
        <>
          <p><strong>1. Choose Your Battlefield</strong> - Select a themed map (with weather and terrain) or a basic arena size.</p>
          <p><strong>2. Pick Your Opponent</strong> - Each AI has a unique personality affecting their tactics:</p>
          <ul style={styles.list}>
            <li><strong>Sir Stumbleheart</strong> - Patient and creative (easiest)</li>
            <li><strong>Lady Swiftblade</strong> - Aggressive and fast</li>
            <li><strong>Thornwick</strong> - Calculating and adaptive</li>
            <li><strong>Grok</strong> - Chaotic and unpredictable</li>
            <li><strong>Archmagus Nethys</strong> - Mystical and patient</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Build Your Hand',
      content: (
        <>
          <p>Before battle, you'll see <strong>15 cards</strong> to choose from.</p>
          <p><strong>Select 5 cards</strong> for your starting hand. The remaining 10 become your draw deck.</p>
          <p>You'll draw 1 card per turn until your deck is empty.</p>
          <p style={{ marginTop: '1rem', fontStyle: 'italic', opacity: 0.9 }}>Tip: Balance your hand with a mix of cheap cards (1-2 mana) for early game and powerful cards (4-5 mana) for late game!</p>
        </>
      ),
    },
    {
      title: 'Deploy Your Forces',
      content: (
        <>
          <p><strong>Click a card</strong> in your hand, then <strong>click an empty battlefield cell</strong> to deploy it.</p>
          <p>Each card costs <strong>mana</strong> to play. You start with 3 mana and gain +1 each turn (max 10).</p>
          <p><strong>Position matters!</strong></p>
          <ul style={styles.list}>
            <li><strong>Front row</strong> - Attack bonuses, first to engage</li>
            <li><strong>Middle column</strong> - Prime position to attack the enemy castle</li>
            <li><strong>Back row</strong> - Ranged bonuses, protected from melee</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Attack & Conquer',
      content: (
        <>
          <p><strong>Select your card</strong> on the battlefield, then <strong>click an enemy card or their castle</strong> to attack.</p>
          <p>Each card can attack <strong>once per turn</strong>. Destroy the enemy castle (<strong>50 HP</strong>) to win!</p>
          <p><strong>Card Stats:</strong></p>
          <ul style={styles.list}>
            <li><strong>Attack</strong> - Damage dealt</li>
            <li><strong>HP</strong> - Health points (0 = destroyed)</li>
            <li><strong>Defense</strong> - Reduces incoming damage</li>
            <li><strong>Speed</strong> - Determines attack order</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Formations & Weather',
      content: (
        <>
          <p>Arrange your cards to activate <strong>formation bonuses</strong>:</p>
          <ul style={styles.list}>
            <li><strong>Vanguard</strong>: 2+ cards in front = +20% attack</li>
            <li><strong>Phalanx</strong>: 3 cards in a row = +30% defense</li>
            <li><strong>Archer Line</strong>: 2+ cards in back = +15% attack</li>
            <li><strong>Flanking</strong>: Cards on both sides = +15% speed</li>
          </ul>
          <p><strong>Weather</strong> changes every few turns - rain reduces attack, fog boosts defense, and more!</p>
        </>
      ),
    },
    {
      title: 'Pro Tips',
      content: (
        <>
          <p><strong>For new players:</strong></p>
          <ul style={styles.list}>
            <li>Going first? Deploy to the middle column to threaten the castle early.</li>
            <li>Don't overextend - keep at least one card to defend your castle!</li>
            <li>Attack enemy cards to clear a path before going for the castle.</li>
            <li>Watch the formation indicator - bonuses can turn the tide!</li>
          </ul>
          <p style={{ marginTop: '1rem' }}><strong>Web3 (Optional):</strong> Connect your wallet to use NFT cards and earn LP stat boosts!</p>
        </>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📖 How to Play 📖</h1>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          <h2 style={styles.stepTitle}>{currentStepData.title}</h2>
          <div style={styles.stepContent}>{currentStepData.content}</div>
        </div>

        <div style={styles.footer}>
          <div style={styles.progressBar}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  ...styles.progressDot,
                  ...(index === currentStep ? styles.progressDotActive : {}),
                }}
              />
            ))}
          </div>

          <div style={styles.buttonRow}>
            <button
              style={{
                ...styles.navButton,
                ...(currentStep === 0 ? styles.navButtonDisabled : {}),
              }}
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              ← Previous
            </button>

            <span style={styles.stepCounter}>
              Step {currentStep + 1} of {steps.length}
            </span>

            <button style={styles.navButton} onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Start Playing! ⚔️' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '700px',
    width: '100%',
    boxShadow: TASERN_SHADOWS.glowGold,
    backdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    color: TASERN_COLORS.gold,
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    minHeight: '340px',
    marginBottom: '2rem',
  },
  stepTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleSmall,
    color: TASERN_COLORS.gold,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  stepContent: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    lineHeight: '1.8',
  },
  list: {
    marginLeft: '1.5rem',
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  footer: {
    borderTop: `2px solid ${TASERN_COLORS.bronze}`,
    paddingTop: '1.5rem',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  progressDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: TASERN_COLORS.bronze,
    opacity: 0.3,
    transition: 'all 0.3s',
  },
  progressDotActive: {
    background: TASERN_COLORS.gold,
    opacity: 1,
    boxShadow: TASERN_SHADOWS.glowGold,
    transform: 'scale(1.2)',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    padding: '0.75rem 1.5rem',
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `2px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  navButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  stepCounter: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
  },
};
