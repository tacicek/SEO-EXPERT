import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          domain: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          domain: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          domain?: string;
          name?: string;
          user_id?: string | null;
        };
      };
      analyses: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          url: string;
          title: string | null;
          site_id: string | null;
          user_id: string | null;
          content: string | null;
          analysis_data: Json | null;
          overall_score: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          url: string;
          title?: string | null;
          site_id?: string | null;
          user_id?: string | null;
          content?: string | null;
          analysis_data?: Json | null;
          overall_score?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          url?: string;
          title?: string | null;
          site_id?: string | null;
          user_id?: string | null;
          content?: string | null;
          analysis_data?: Json | null;
          overall_score?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
        };
      };
    };
  };
}
