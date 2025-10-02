/**
 * Supabase Client Configuration
 *
 * Simple stack: Supabase for Postgres + Realtime + Auth
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types (generated from Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string;
          lp_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      games: {
        Row: {
          id: string;
          player1_id: string;
          player2_id: string;
          state: any; // BattleState JSON
          status: 'waiting' | 'active' | 'completed';
          winner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['games']['Insert']>;
      };
      match_queue: {
        Row: {
          id: string;
          user_id: string;
          status: 'waiting' | 'matched';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['match_queue']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['match_queue']['Insert']>;
      };
    };
  };
}
