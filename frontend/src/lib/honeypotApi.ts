// API Service for communicating with the Agentic Honeypot Backend

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000/api';

export interface HandoffRequest {
    chatHistory: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
}

export interface HandoffResponse {
    success: boolean;
    data: {
        sessionId: string;
        message: string;
        initialIntelligence: ThreatIntel[];
        toolCallsMade: number;
    };
}

export interface MessageRequest {
    sessionId: string;
    message: string;
}

export interface MessageResponse {
    success: boolean;
    data: {
        sessionId: string;
        reply: string;
        intelExtracted: boolean;
        threats: ThreatIntel[];
        toolCallsMade: number;
    };
}

export interface ThreatIntel {
    type: 'UPI' | 'BANK_ACCOUNT' | 'PHISHING_URL' | 'PHONE_NUMBER' | 'EMAIL';
    value: string;
}

export interface SessionDetails {
    success: boolean;
    data: {
        session: {
            id: string;
            session_id: string;
            is_active: boolean;
            persona_name: string;
            chat_history: Array<{
                role: string;
                content: string;
                timestamp: string;
            }>;
            started_at: string;
            last_activity: string;
        };
        intelligenceCount: number;
        intelligence: Array<{
            id: string;
            session_id: string;
            type: string;
            value: string;
            context: string;
            severity: string;
            extracted_at: string;
        }>;
    };
}

export interface IntelResponse {
    success: boolean;
    data: {
        count: number;
        intelligence: Array<{
            id: string;
            session_id: string;
            type: string;
            value: string;
            context: string;
            severity: string;
            extracted_at: string;
        }>;
    };
}

class HoneypotAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Handoff a chat to the AI agent
     */
    async handoff(chatHistory: HandoffRequest['chatHistory']): Promise<HandoffResponse> {
        const response = await fetch(`${this.baseUrl}/handoff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatHistory }),
        });

        if (!response.ok) {
            throw new Error(`Handoff failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Send a message to an active session
     */
    async sendMessage(sessionId: string, message: string): Promise<MessageResponse> {
        const response = await fetch(`${this.baseUrl}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, message }),
        });

        if (!response.ok) {
            throw new Error(`Send message failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get session details
     */
    async getSession(sessionId: string): Promise<SessionDetails> {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`);

        if (!response.ok) {
            throw new Error(`Get session failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get all threat intelligence with optional filters
     */
    async getIntelligence(filters?: {
        type?: string;
        sessionId?: string;
        severity?: string;
        limit?: number;
    }): Promise<IntelResponse> {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.sessionId) params.append('sessionId', filters.sessionId);
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const url = `${this.baseUrl}/intel${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Get intelligence failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Deactivate a session
     */
    async deactivateSession(sessionId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/deactivate`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error(`Deactivate session failed: ${response.statusText}`);
        }
    }

    /**
     * Check backend health
     */
    async healthCheck(): Promise<{ success: boolean; message: string }> {
        const response = await fetch(this.baseUrl.replace('/api', '/health'));

        if (!response.ok) {
            throw new Error('Backend is not responding');
        }

        return response.json();
    }
}

export const honeypotAPI = new HoneypotAPI();
export default honeypotAPI;
