import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import honeypotAPI from './lib/honeypotApi';
import ChatDisplay from './components/ChatDisplay';
import IntelligenceFeed from './components/IntelligenceFeed';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface IntelligenceItem {
  id: string;
  type: string;
  value: string;
  severity: string;
  extracted_at: string;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Setup realtime subscriptions for threat intelligence
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel('threat_intel_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threat_intel',
          filter: `session_id=eq.${currentSessionId}`,
        },
        (payload) => {
          const newIntel = payload.new as IntelligenceItem;
          setIntelligence((prev) => [newIntel, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentSessionId]);

  const checkBackendHealth = async () => {
    try {
      await honeypotAPI.healthCheck();
      setBackendStatus('online');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  const handleSendMessage = async (userMessage: string) => {
    setError(null);
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;

      // If no session exists, create one with the first message
      if (!sessionId) {
        const initialChat = [
          {
            role: 'user' as const,
            content: userMessage,
          },
        ];

        const response = await honeypotAPI.handoff(initialChat);

        if (response.success) {
          sessionId = response.data.sessionId;
          setCurrentSessionId(sessionId);

          const chatMessages = [
            {
              role: 'user',
              content: userMessage,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: response.data.message,
              timestamp: new Date().toISOString(),
            },
          ];

          setMessages(chatMessages);

          if (response.data.initialIntelligence.length > 0) {
            setIntelligence(
              response.data.initialIntelligence.map((intel, idx) => ({
                id: `initial-${idx}`,
                type: intel.type,
                value: intel.value,
                severity: 'high',
                extracted_at: new Date().toISOString(),
              }))
            );
          }
        }
      } else {
        // Session exists, send message to existing session
        const response = await honeypotAPI.sendMessage(sessionId, userMessage);

        if (response.success) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content: userMessage,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: response.data.reply,
              timestamp: new Date().toISOString(),
            },
          ]);

          if (response.data.intelExtracted && response.data.threats.length > 0) {
            const newIntel = response.data.threats.map((threat, idx) => ({
              id: `${sessionId}-${Date.now()}-${idx}`,
              type: threat.type,
              value: threat.value,
              severity: 'high',
              extracted_at: new Date().toISOString(),
            }));
            setIntelligence((prev) => [...newIntel, ...prev]);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Check backend connection.');
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Scam Analyzer</h1>
                <p className="text-sm text-gray-600">Analyze messages for spam/scam content & extract threat intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Backend Status */}
              <div className="flex items-center gap-2">
                {backendStatus === 'online' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Backend Online</span>
                  </>
                )}
                {backendStatus === 'offline' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">Backend Offline</span>
                  </>
                )}
                {backendStatus === 'checking' && (
                  <span className="text-sm text-gray-500">Checking backend...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Make sure the backend server is running at {import.meta.env.VITE_BACKEND_API_URL || 'the configured URL'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Chat */}
          <div className="lg:col-span-1">
            <ChatDisplay
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          {/* Right Panel - Intelligence */}
          <div className="lg:col-span-1">
            <IntelligenceFeed intelligence={intelligence} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
