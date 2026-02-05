import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import honeypotAPI from './lib/honeypotApi';
import ChatDisplay from './components/ChatDisplay';
import IntelligenceFeed from './components/IntelligenceFeed';
import ActivateAgentButton from './components/ActivateAgentButton';
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
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);

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

  const handleActivateAgent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initial conversation from user to scammer
      const initialChat = [
        {
          role: 'user' as const,
          content: 'Hello, I received a call that my bank account has suspicious activity. Is this you calling?',
        },
        {
          role: 'assistant' as const,
          content: 'Yes madam, I am calling from your bank security department. We have detected unauthorized transactions on your account.',
        },
        {
          role: 'user' as const,
          content: 'Oh no! What should I do?',
        },
      ];

      // Handoff to AI agent
      const response = await honeypotAPI.handoff(initialChat);

      if (response.success) {
        setCurrentSessionId(response.data.sessionId);

        // Set initial messages
        const chatMessages = [
          ...initialChat.map((msg, idx) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(Date.now() - (initialChat.length - idx) * 1000).toISOString(),
          })),
          {
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date().toISOString(),
          },
        ];

        setMessages(chatMessages);

        // Set initial intelligence if any
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

        // Start simulated scammer conversation
        simulateScammerConversation(response.data.sessionId);
      }
    } catch (error) {
      console.error('Error activating agent:', error);
      setError('Failed to activate agent. Make sure the backend is running.');
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateScammerConversation = async (sessionId: string) => {
    // Simulate scammer messages over time
    const scammerMessages = [
      { text: 'First, I need to verify your identity. Can you confirm your UPI ID?', delay: 3000 },
      { text: 'Also, for security purposes, we need you to install our secure app. Please click this link: https://fake-bank-security.com/app', delay: 6000 },
      { text: 'To unblock your account immediately, please send ₹100 to verify your account. Send to merchant@paytm', delay: 9000 },
      { text: 'Madam, are you still there? We need to act quickly to protect your account. My contact number is 9876543210 if you need help.', delay: 12000 },
    ];

    for (const msg of scammerMessages) {
      await new Promise((resolve) => setTimeout(resolve, msg.delay));

      try {
        const response = await honeypotAPI.sendMessage(sessionId, msg.text);

        if (response.success) {
          // Add scammer message
          setMessages((prev) => [
            ...prev,
            {
              role: 'user',
              content: msg.text,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: response.data.reply,
              timestamp: new Date().toISOString(),
            },
          ]);

          // Update intelligence if any was extracted
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
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleDeactivateAgent = async () => {
    if (!currentSessionId) return;

    setIsLoading(true);
    try {
      await honeypotAPI.deactivateSession(currentSessionId);
      setCurrentSessionId(null);
      setMessages([]);
      setIntelligence([]);
    } catch (error) {
      console.error('Error deactivating agent:', error);
      setError('Failed to deactivate session');
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = currentSessionId !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agentic AI Honeypot</h1>
                <p className="text-sm text-gray-600">AI-powered scam detection & intelligence extraction</p>
              </div>
            </div>

            {/* Backend Status Indicator */}
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
      </header>

      <main className="max-w-[1800px] mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Make sure the backend server is running on http://localhost:3000
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ActivateAgentButton
              isActive={isActive}
              isLoading={isLoading}
              onActivate={handleActivateAgent}
              onDeactivate={handleDeactivateAgent}
            />
            <div className="flex-1">
              <ChatDisplay messages={messages} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <IntelligenceFeed intelligence={intelligence} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
