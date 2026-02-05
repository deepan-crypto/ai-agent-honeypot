interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface ChatDisplayProps {
  messages: ChatMessage[];
}

import { MessageCircle } from 'lucide-react';

export default function ChatDisplay({ messages }: ChatDisplayProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <MessageCircle className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Live Chat Monitor</h2>
        {messages.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Activate the agent to start conversation...</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={`${msg.timestamp}-${idx}`}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'bg-red-50 text-gray-800 rounded-bl-none border border-red-200'
                    : 'bg-blue-600 text-white rounded-br-none'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-75">
                    {msg.role === 'user' ? '🚨 Scammer' : '🤖 AI Agent (Martha)'}
                  </span>
                  <span className="text-xs opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
