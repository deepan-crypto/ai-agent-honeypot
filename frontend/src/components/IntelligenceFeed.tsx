import { Shield, CreditCard, Phone, Link2, Mail, AlertTriangle } from 'lucide-react';

interface IntelligenceItem {
  id: string;
  type: string;
  value: string;
  severity: string;
  extracted_at: string;
}

interface IntelligenceFeedProps {
  intelligence: IntelligenceItem[];
}

const getIcon = (dataType: string) => {
  switch (dataType.toUpperCase()) {
    case 'UPI':
      return <CreditCard className="w-5 h-5" />;
    case 'PHONE_NUMBER':
    case 'PHONE':
      return <Phone className="w-5 h-5" />;
    case 'BANK_ACCOUNT':
      return <CreditCard className="w-5 h-5" />;
    case 'PHISHING_URL':
      return <Link2 className="w-5 h-5" />;
    case 'EMAIL':
      return <Mail className="w-5 h-5" />;
    default:
      return <AlertTriangle className="w-5 h-5" />;
  }
};

const getTypeLabel = (dataType: string) => {
  switch (dataType.toUpperCase()) {
    case 'UPI':
      return 'UPI ID';
    case 'PHONE_NUMBER':
    case 'PHONE':
      return 'Phone Number';
    case 'BANK_ACCOUNT':
      return 'Bank Account';
    case 'PHISHING_URL':
      return 'Phishing URL';
    case 'EMAIL':
      return 'Email Address';
    default:
      return dataType.replace('_', ' ');
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-700 bg-red-100 border-red-300';
    case 'high':
      return 'text-orange-700 bg-orange-100 border-orange-300';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'low':
      return 'text-blue-700 bg-blue-100 border-blue-300';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-300';
  }
};

const getTypeColor = (dataType: string) => {
  switch (dataType.toUpperCase()) {
    case 'UPI':
      return 'bg-purple-100 text-purple-600';
    case 'PHONE_NUMBER':
    case 'PHONE':
      return 'bg-blue-100 text-blue-600';
    case 'BANK_ACCOUNT':
      return 'bg-red-100 text-red-600';
    case 'PHISHING_URL':
      return 'bg-orange-100 text-orange-600';
    case 'EMAIL':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function IntelligenceFeed({ intelligence }: IntelligenceFeedProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <Shield className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-800">Threat Intelligence</h2>
        {intelligence.length > 0 && (
          <div className="ml-auto">
            <span className="px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
              {intelligence.length} detected
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {intelligence.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg">No threats detected yet</p>
              <p className="text-sm">AI will extract data automatically</p>
            </div>
          </div>
        ) : (
          intelligence.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 animate-[slideIn_0.3s_ease-out]"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {getTypeLabel(item.type)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border font-medium ${getSeverityColor(
                        item.severity
                      )}`}
                    >
                      {item.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-gray-900 break-all bg-gray-100 px-3 py-2 rounded-md border border-gray-200">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>🕐</span>
                    {new Date(item.extracted_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
