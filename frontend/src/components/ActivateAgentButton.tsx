import { Zap, Loader2 } from 'lucide-react';

interface ActivateAgentButtonProps {
  isActive: boolean;
  isLoading: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

export default function ActivateAgentButton({
  isActive,
  isLoading,
  onActivate,
  onDeactivate,
}: ActivateAgentButtonProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Agent Control</h3>
        <p className="text-sm text-gray-600">
          {isActive
            ? 'Agent is monitoring the conversation'
            : 'Activate AI agent to start monitoring'}
        </p>
      </div>

      <button
        onClick={isActive ? onDeactivate : onActivate}
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg ${
          isActive
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Zap className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
            <span>{isActive ? 'DEACTIVATE AGENT' : 'ACTIVATE AGENT'}</span>
          </>
        )}
      </button>

      {isActive && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              Agent is actively monitoring
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
