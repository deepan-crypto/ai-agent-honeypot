/*
  # Chat Intelligence System Schema

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `sender` (text) - 'user' or 'scammer'
      - `message` (text) - message content
      - `timestamp` (timestamptz) - when message was sent
      - `session_id` (uuid) - links messages to sessions
      - `created_at` (timestamptz)
    
    - `intelligence_data`
      - `id` (uuid, primary key)
      - `data_type` (text) - 'upi_id', 'phone', 'bank_account', etc.
      - `value` (text) - the extracted value
      - `confidence` (numeric) - confidence score 0-100
      - `session_id` (uuid) - links to session
      - `extracted_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `agent_sessions`
      - `id` (uuid, primary key)
      - `status` (text) - 'inactive', 'active', 'completed'
      - `activated_at` (timestamptz)
      - `deactivated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (demo purposes)
    
  3. Important Notes
    - All tables use UUIDs for primary keys
    - Timestamps use timestamptz for timezone awareness
    - RLS policies allow public read/write for demo purposes
*/

CREATE TABLE IF NOT EXISTS agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'inactive',
  activated_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  session_id uuid REFERENCES agent_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intelligence_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL,
  value text NOT NULL,
  confidence numeric DEFAULT 0,
  session_id uuid REFERENCES agent_sessions(id) ON DELETE CASCADE,
  extracted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to agent_sessions"
  ON agent_sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to agent_sessions"
  ON agent_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to agent_sessions"
  ON agent_sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to chat_messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to chat_messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to intelligence_data"
  ON intelligence_data FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to intelligence_data"
  ON intelligence_data FOR INSERT
  TO anon
  WITH CHECK (true);