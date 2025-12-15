/**
 * Manage Portfolio Modal
 *
 * UI for managing multi-address NFT/LP portfolio aggregation.
 * Allows adding read-only addresses and toggling aggregation settings.
 */

import React, { useState } from 'react';
import { useWalletPortfolioStore, LinkedAddress } from '../state/walletPortfolioStore';

interface ManagePortfolioProps {
  isOpen: boolean;
  onClose: () => void;
  onScanAll: () => void;
}

export const ManagePortfolio: React.FC<ManagePortfolioProps> = ({
  isOpen,
  onClose,
  onScanAll,
}) => {
  const {
    primaryAddress,
    linkedAddresses,
    aggregateNFTs,
    aggregateLP,
    addLinkedAddress,
    removeLinkedAddress,
    updateLinkedAddress,
    setAggregateNFTs,
    setAggregateLP,
  } = useWalletPortfolioStore();

  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAddress = () => {
    setError(null);

    // Basic validation
    const trimmed = newAddress.trim();
    if (!trimmed) {
      setError('Please enter an address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setError('Invalid Ethereum address format');
      return;
    }

    // Check if already in portfolio
    if (linkedAddresses.some((a) => a.address === trimmed.toLowerCase())) {
      setError('Address already in portfolio');
      return;
    }

    addLinkedAddress(trimmed, newLabel.trim() || 'Linked Wallet', false);
    setNewAddress('');
    setNewLabel('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAddress();
    }
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const totalAddresses = linkedAddresses.length;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Manage Portfolio</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Stats Bar */}
        <div style={styles.statsBar}>
          <span style={styles.stat}>
            📦 {totalAddresses} wallet{totalAddresses !== 1 ? 's' : ''}
          </span>
          <span style={styles.stat}>
            ✓ {linkedAddresses.filter((a) => a.verified).length} verified
          </span>
        </div>

        {/* Aggregation Settings */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Aggregation Settings</h3>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={aggregateNFTs}
              onChange={(e) => setAggregateNFTs(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Combine NFTs from all wallets</span>
          </label>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={aggregateLP}
              onChange={(e) => setAggregateLP(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Aggregate LP balances for stat boosts</span>
          </label>
        </div>

        {/* Address List */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Portfolio Addresses</h3>
          <div style={styles.addressList}>
            {linkedAddresses.length === 0 ? (
              <p style={styles.emptyText}>
                Connect a wallet to start your portfolio
              </p>
            ) : (
              linkedAddresses.map((addr) => (
                <AddressRow
                  key={addr.address}
                  address={addr}
                  isPrimary={addr.address === primaryAddress}
                  isEditingLabel={editingLabel === addr.address}
                  onEditLabel={() => setEditingLabel(addr.address)}
                  onSaveLabel={(label) => {
                    updateLinkedAddress(addr.address, { label });
                    setEditingLabel(null);
                  }}
                  onCancelEdit={() => setEditingLabel(null)}
                  onRemove={() => removeLinkedAddress(addr.address)}
                />
              ))
            )}
          </div>
        </div>

        {/* Add New Address */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Add Wallet Address</h3>
          <p style={styles.helpText}>
            Add addresses you own to aggregate their NFTs and LP tokens.
            Read-only addresses can view NFTs but aren't signature-verified.
          </p>
          <div style={styles.inputRow}>
            <input
              type="text"
              placeholder="0x..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
            />
          </div>
          <div style={styles.inputRow}>
            <input
              type="text"
              placeholder="Label (optional, e.g. 'Cold Wallet')"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ ...styles.input, flex: 1 }}
            />
            <button style={styles.addButton} onClick={handleAddAddress}>
              + Add
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.scanButton} onClick={onScanAll}>
            🔍 Scan All Wallets
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for address rows
interface AddressRowProps {
  address: LinkedAddress;
  isPrimary: boolean;
  isEditingLabel: boolean;
  onEditLabel: () => void;
  onSaveLabel: (label: string) => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}

const AddressRow: React.FC<AddressRowProps> = ({
  address,
  isPrimary,
  isEditingLabel,
  onEditLabel,
  onSaveLabel,
  onCancelEdit,
  onRemove,
}) => {
  const [editValue, setEditValue] = useState(address.label);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div style={styles.addressRow}>
      <div style={styles.addressInfo}>
        {/* Badges */}
        <div style={styles.badges}>
          {isPrimary && <span style={styles.primaryBadge}>CONNECTED</span>}
          {address.verified ? (
            <span style={styles.verifiedBadge}>✓ Verified</span>
          ) : (
            <span style={styles.readOnlyBadge}>Read-only</span>
          )}
        </div>

        {/* Label */}
        {isEditingLabel ? (
          <div style={styles.editLabelRow}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={styles.labelInput}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') onSaveLabel(editValue);
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              style={styles.saveLabelBtn}
              onClick={() => onSaveLabel(editValue)}
            >
              ✓
            </button>
            <button style={styles.cancelLabelBtn} onClick={onCancelEdit}>
              ✕
            </button>
          </div>
        ) : (
          <span style={styles.label} onClick={onEditLabel} title="Click to edit">
            {address.label}
          </span>
        )}

        {/* Address */}
        <span style={styles.address}>{formatAddress(address.address)}</span>

        {/* Last scanned */}
        {address.lastScanned && (
          <span style={styles.lastScanned}>
            Scanned {new Date(address.lastScanned).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Remove button (not for primary) */}
      {!isPrimary && (
        <button
          style={styles.removeButton}
          onClick={onRemove}
          title="Remove from portfolio"
        >
          🗑️
        </button>
      )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000, // Above NFTGallery (1000)
  },
  modal: {
    backgroundColor: '#1a1410',
    border: '3px solid #D4AF37',
    borderRadius: '16px',
    padding: '1.5rem',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 0 60px rgba(212, 175, 55, 0.4), 0 25px 50px rgba(0, 0, 0, 0.8)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #8B6914',
    paddingBottom: '0.75rem',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: '22px',
    color: '#D4AF37',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#F4E4C1',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  statsBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '8px',
  },
  stat: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '14px',
    color: '#F4E4C1',
  },
  section: {
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: '14px',
    color: '#D4AF37',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: "'Crimson Text', serif",
    fontSize: '14px',
    color: '#F4E4C1',
    marginBottom: '0.5rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#D4AF37',
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  emptyText: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '14px',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  addressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0.75rem',
    backgroundColor: 'rgba(92, 64, 51, 0.3)',
    border: '1px solid #5C4033',
    borderRadius: '8px',
  },
  addressInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  primaryBadge: {
    backgroundColor: '#1E3A8A',
    color: '#F4E4C1',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    backgroundColor: '#065F46',
    color: '#F4E4C1',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  readOnlyBadge: {
    backgroundColor: '#6B7280',
    color: '#F4E4C1',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  label: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '15px',
    color: '#F4E4C1',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  lastScanned: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '11px',
    color: '#6B7280',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.7,
  },
  editLabelRow: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  labelInput: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '14px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #8B6914',
    backgroundColor: '#2a2420',
    color: '#F4E4C1',
    flex: 1,
  },
  saveLabelBtn: {
    background: '#065F46',
    color: '#F4E4C1',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
  },
  cancelLabelBtn: {
    background: '#6B7280',
    color: '#F4E4C1',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
  },
  helpText: {
    fontFamily: "'Crimson Text', serif",
    fontSize: '13px',
    color: '#9CA3AF',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  input: {
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #5C4033',
    backgroundColor: '#2a2420',
    color: '#F4E4C1',
    flex: 2,
  },
  addButton: {
    backgroundColor: '#D4AF37',
    color: '#1a1a1a',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    whiteSpace: 'nowrap',
  },
  error: {
    color: '#EF4444',
    fontSize: '13px',
    marginTop: '0.25rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #8B6914',
  },
  scanButton: {
    backgroundColor: '#1E3A8A',
    color: '#F4E4C1',
    border: '2px solid #1E40AF',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default ManagePortfolio;
