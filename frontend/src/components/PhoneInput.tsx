import { useState } from 'react';
import { Phone, Plus } from 'lucide-react';

interface PhoneInputProps {
    onAddNumber: (phoneNumber: string) => void;
    whatsappNumbers: string[];
}

export default function PhoneInput({ onAddNumber, whatsappNumbers }: PhoneInputProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone number
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.length < 10) {
            setError('Please enter a valid phone number (at least 10 digits)');
            return;
        }

        if (whatsappNumbers.includes(cleaned)) {
            setError('This number is already being monitored');
            return;
        }

        onAddNumber(cleaned);
        setPhoneNumber('');
        setError('');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Add Scammer Number</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (with country code)
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            setError('');
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="+1 234 567 8900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        AI will respond to WhatsApp messages from this number
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Number to Honeypot
                </button>
            </form>

            {whatsappNumbers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Monitored Numbers ({whatsappNumbers.length})
                    </h3>
                    <div className="space-y-2">
                        {whatsappNumbers.map((number, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                                <span className="font-mono text-sm text-gray-800">+{number}</span>
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                    Active
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When the scammer messages your WhatsApp number,
                    Martha (AI) will automatically respond and extract threat intelligence.
                </p>
            </div>
        </div>
    );
}
