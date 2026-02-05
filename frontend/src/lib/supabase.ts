import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  session_id: string;
  created_at: string;
}

export interface IntelligenceData {
  id: string;
  data_type: string;
  value: string;
  confidence: number;
  session_id: string;
  extracted_at: string;
  created_at: string;
}

export interface AgentSession {
  id: string;
  status: string;
  activated_at: string | null;
  deactivated_at: string | null;
  created_at: string;
}
