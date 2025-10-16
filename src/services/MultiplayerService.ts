/**
 * Multiplayer Service - WebRTC Connection Management
 *
 * Handles peer-to-peer connections via PeerJS for multiplayer battles.
 * Uses wallet addresses as unique peer IDs for Web3-native matchmaking.
 *
 * Philosophy: Decentralized connections, no central game server needed.
 */

import Peer, { DataConnection } from 'peerjs';
import type { BattleAction, BattleState, Card } from '../types/core';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MultiplayerMessage =
  | { type: 'INVITE'; inviteCode: string; playerName: string; walletAddress: string }
  | { type: 'ACCEPT'; playerName: string; walletAddress: string; deck: Card[] }
  | { type: 'DECK_SELECTED'; deck: Card[] }
  | { type: 'ACTION'; action: BattleAction }
  | { type: 'STATE_SYNC'; state: BattleState }
  | { type: 'TURN_START'; playerId: string; state: BattleState }
  | { type: 'BATTLE_START'; hostDeck: Card[]; guestDeck: Card[] }
  | { type: 'PING' }
  | { type: 'PONG' }
  | { type: 'DISCONNECT'; reason?: string };

interface InviteData {
  peerId: string;
  playerName: string;
  walletAddress: string;
  timestamp: number;
}

// ============================================================================
// MULTIPLAYER SERVICE
// ============================================================================

export class MultiplayerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize PeerJS connection
   * Uses wallet address as unique peer ID for consistent identity
   */
  async initialize(walletAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use wallet address hash as peer ID (consistent and unique)
      const peerId = `tasern-${walletAddress.toLowerCase()}`;

      console.log('🌐 Initializing peer with ID:', peerId);

      this.peer = new Peer(peerId, {
        // Use free PeerJS cloud server (can self-host later)
        debug: 2, // Log level (1=errors, 2=warnings, 3=all)
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
            { urls: 'stun:global.stun.twilio.com:3478' } // Twilio STUN backup
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('✅ Peer connection opened:', id);
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('❌ Peer error:', err);

        // Handle ID already taken error (wallet already connected elsewhere)
        if (err.type === 'unavailable-id') {
          reject(new Error('This wallet is already connected. Disconnect other sessions first.'));
        } else {
          reject(err);
        }
      });

      this.peer.on('connection', (conn) => {
        console.log('📞 Incoming connection from:', conn.peer);
        this.handleConnection(conn);
      });

      this.peer.on('disconnected', () => {
        console.warn('⚠️ Peer disconnected from signaling server');
        this.attemptReconnect();
      });
    });
  }

  /**
   * Create invite code for opponent to join
   */
  createInvite(playerName: string, walletAddress: string): string {
    if (!this.peer) {
      throw new Error('Peer not initialized. Call initialize() first.');
    }

    const inviteData: InviteData = {
      peerId: this.peer.id,
      playerName,
      walletAddress,
      timestamp: Date.now()
    };

    // Encode as base64 for easy sharing (can paste in Discord, Twitter, etc.)
    const encoded = btoa(JSON.stringify(inviteData));

    console.log('🎫 Invite code created:', encoded);

    return encoded;
  }

  /**
   * Join game via invite code
   */
  async joinGame(inviteCode: string): Promise<InviteData> {
    if (!this.peer) {
      throw new Error('Peer not initialized. Call initialize() first.');
    }

    let inviteData: InviteData;

    try {
      const decoded = atob(inviteCode);
      inviteData = JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid invite code. Please check and try again.');
    }

    // Check if invite is expired (24 hours)
    const age = Date.now() - inviteData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      throw new Error('Invite code expired. Please request a new one.');
    }

    console.log('🎮 Joining game with peer:', inviteData.peerId);

    return new Promise((resolve, reject) => {
      const conn = this.peer!.connect(inviteData.peerId, {
        reliable: true, // TCP-like reliability for turn-based game
        serialization: 'json'
      });

      conn.on('open', () => {
        console.log('✅ Connected to host');
        this.handleConnection(conn);
        resolve(inviteData);
      });

      conn.on('error', (err) => {
        console.error('❌ Connection error:', err);
        reject(new Error('Failed to connect to host. They may be offline.'));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!conn.open) {
          reject(new Error('Connection timeout. Host may be offline.'));
        }
      }, 10000);
    });
  }

  /**
   * Handle new connection (incoming or outgoing)
   */
  private handleConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('open', () => {
      console.log('✅ Data channel established with:', conn.peer);
      this.emit('connected', { peerId: conn.peer });
      this.startPingPong();
    });

    conn.on('data', (data) => {
      const message = data as MultiplayerMessage;
      console.log('📨 Received message:', message.type);

      this.handleMessage(message);
    });

    conn.on('close', () => {
      console.log('🔌 Connection closed');
      this.stopPingPong();
      this.emit('disconnected', { reason: 'Connection closed' });
    });

    conn.on('error', (err) => {
      console.error('❌ Connection error:', err);
      this.emit('error', { error: err });
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: MultiplayerMessage) {
    switch (message.type) {
      case 'ACCEPT':
        this.emit('opponentAccepted', {
          playerName: message.playerName,
          walletAddress: message.walletAddress,
          deck: message.deck
        });
        break;

      case 'DECK_SELECTED':
        this.emit('deckSelected', { deck: message.deck });
        break;

      case 'BATTLE_START':
        this.emit('battleStart', {
          hostDeck: message.hostDeck,
          guestDeck: message.guestDeck
        });
        break;

      case 'ACTION':
        this.emit('action', { action: message.action });
        break;

      case 'STATE_SYNC':
        this.emit('stateSync', { state: message.state });
        break;

      case 'TURN_START':
        this.emit('turnStart', {
          playerId: message.playerId,
          state: message.state
        });
        break;

      case 'PING':
        this.send({ type: 'PONG' });
        break;

      case 'PONG':
        // Keep-alive response received
        break;

      case 'DISCONNECT':
        console.log('🔌 Opponent disconnected:', message.reason);
        this.emit('opponentDisconnected', { reason: message.reason });
        break;

      default:
        console.warn('⚠️ Unknown message type:', (message as any).type);
    }
  }

  /**
   * Send message to connected opponent
   */
  send(message: MultiplayerMessage) {
    if (!this.connection || !this.connection.open) {
      console.warn('⚠️ Cannot send - no active connection');
      return;
    }

    try {
      this.connection.send(message);
      console.log('📤 Sent message:', message.type);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.emit('error', { error });
    }
  }

  /**
   * Start ping-pong keep-alive
   */
  private startPingPong() {
    this.stopPingPong();

    // Send ping every 10 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.connection?.open) {
        this.send({ type: 'PING' });
      }
    }, 10000);
  }

  /**
   * Stop ping-pong keep-alive
   */
  private stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect to signaling server
   */
  private attemptReconnect() {
    // Don't try to reconnect if peer is destroyed or doesn't exist
    if (!this.peer || this.peer.destroyed) {
      console.warn('⚠️ Cannot reconnect - peer is destroyed');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      // Check again before attempting reconnect
      if (this.peer && !this.peer.destroyed) {
        try {
          this.peer.reconnect();
        } catch (error) {
          console.error('❌ Reconnect failed:', error);
          this.emit('reconnectFailed');
        }
      }
    }, 1000 * this.reconnectAttempts); // Exponential backoff
  }

  /**
   * Check if currently connected to opponent
   */
  isConnected(): boolean {
    return this.connection?.open ?? false;
  }

  /**
   * Get current peer ID
   */
  getPeerId(): string | null {
    return this.peer?.id ?? null;
  }

  /**
   * Get connected peer ID
   */
  getConnectedPeerId(): string | null {
    return this.connection?.peer ?? null;
  }

  /**
   * Event handling (pub/sub pattern)
   */
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`❌ Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Gracefully disconnect
   */
  disconnect(reason?: string) {
    console.log('🔌 Disconnecting...', reason);

    // Notify opponent
    if (this.connection?.open) {
      this.send({ type: 'DISCONNECT', reason });
    }

    // Clean up
    this.stopPingPong();

    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Clear event handlers
    this.eventHandlers.clear();
    this.reconnectAttempts = 0;

    console.log('✅ Disconnected');
  }
}
