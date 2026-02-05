-- Create sessions table
-- This stores active honeypot sessions with chat history
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  persona_name VARCHAR(100) DEFAULT 'Martha',
  chat_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create threat_intel table
-- This stores extracted threat intelligence (UPI, bank details, phishing URLs)
CREATE TABLE IF NOT EXISTS threat_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) REFERENCES sessions(session_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('UPI', 'BANK_ACCOUNT', 'PHISHING_URL', 'PHONE_NUMBER', 'EMAIL')),
  value TEXT NOT NULL,
  context TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_threat_intel_session_id ON threat_intel(session_id);
CREATE INDEX IF NOT EXISTS idx_threat_intel_type ON threat_intel(type);
CREATE INDEX IF NOT EXISTS idx_threat_intel_extracted_at ON threat_intel(extracted_at);
CREATE INDEX IF NOT EXISTS idx_threat_intel_severity ON threat_intel(severity);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on sessions table
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intel ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous access (you can modify based on your needs)
CREATE POLICY "Allow anonymous access to sessions" ON sessions
  FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to threat_intel" ON threat_intel
  FOR ALL USING (true);
