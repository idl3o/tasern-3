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
          <p>Face off against AI opponents with distinct personalities, or challenge a friend!</p>
        </>
      ),
    },
    {
      title: 'Choose Your Deck',
      content: (
        <>
          <p>Before battle, you'll see <strong>15 cards</strong> from which to choose.</p>
          <p><strong>Select 5 cards</strong> for your starting hand. The remaining 10 go to your deck.</p>
          <p>You'll draw 1 card per turn from your deck until it's empty.</p>
        </>
      ),
    },
    {
      title: 'Deploy Your Forces',
      content: (
        <>
          <p><strong>Click a card</strong> in your hand, then <strong>click an empty battlefield space</strong> to deploy it.</p>
          <p>Each card costs <strong>mana</strong> to play. You start with 10 mana and gain more each turn.</p>
          <p>Position matters! Front row gives attack bonuses, back row gives ranged advantages.</p>
        </>
      ),
    },
    {
      title: 'Attack & Conquer',
      content: (
        <>
          <p><strong>Select your card</strong> on the battlefield, then <strong>click an enemy card or castle</strong> to attack.</p>
          <p>Each card can attack once per turn. Destroy the enemy castle (50 HP) to win!</p>
          <p>Cards have <strong>Attack</strong>, <strong>HP</strong>, <strong>Defense</strong>, and <strong>Speed</strong> stats.</p>
        </>
      ),
    },
    {
      title: 'Tactical Formations',
      content: (
        <>
          <p>Arrange your cards to activate <strong>formations</strong>:</p>
          <ul style={styles.list}>
            <li><strong>Vanguard</strong>: 2+ cards in front = +20% attack</li>
            <li><strong>Phalanx</strong>: 3 cards in a row = +30% defense</li>
            <li><strong>Archer Line</strong>: 2+ cards in back = +15% attack</li>
          </ul>
          <p>Weather effects change every few turns, modifying all card stats!</p>
        </>
      ),
    },
    {
      title: 'Web3 Features (Optional)',
      content: (
        <>
          <p>Connect your wallet to unlock NFT cards from the Tasern Universe!</p>
          <p><strong>NFT Gallery</strong>: View your NFTs as playable cards with provenance verification.</p>
          <p><strong>LP Bonuses</strong>: Hold Tasern LP tokens to boost your card stats!</p>
          <p>Web3 is optional - you can play without connecting a wallet.</p>
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
    minHeight: '300px',
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
