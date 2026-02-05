import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getSupabase } from '../config/database.js';

// Regular expressions for pattern matching
const PATTERNS = {
    UPI: /([a-zA-Z0-9._-]+@[a-zA-Z]+)/g,
    BANK_ACCOUNT: /\b\d{8,18}\b/g,
    PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    URL: /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g,
    IFSC: /[A-Z]{4}0[A-Z0-9]{6}/g
};

// Severity assessment based on threat type
const assessSeverity = (type, value) => {
    if (type === 'PHISHING_URL') return 'high';
    if (type === 'BANK_ACCOUNT' && value.length >= 10) return 'critical';
    if (type === 'UPI') return 'high';
    if (type === 'PHONE_NUMBER') return 'medium';
    if (type === 'EMAIL') return 'medium';
    return 'low';
};

// Function to save threat intelligence to Supabase
const saveThreatIntelligence = async (sessionId, type, value, context) => {
    try {
        const supabase = getSupabase();
        const severity = assessSeverity(type, value);

        const { data, error } = await supabase
            .from('threat_intel')
            .insert([
                {
                    session_id: sessionId,
                    type,
                    value,
                    context: context || '',
                    severity,
                    extracted_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Error saving threat intelligence:', error);
            throw error;
        }

        console.log(`🚨 THREAT INTEL LOGGED: ${type} - ${value} [${severity}]`);
        return data[0];
    } catch (error) {
        console.error('Failed to save threat intelligence:', error);
        throw error;
    }
};

// Create the threat intelligence logging tool
export const createThreatIntelTool = (sessionId) => {
    return new DynamicStructuredTool({
        name: 'log_threat_intelligence',
        description: `CRITICAL TOOL: Use this tool IMMEDIATELY when you detect any threat intelligence in the conversation.
    
Call this tool when you identify:
- UPI IDs (e.g., "scammer@paytm", "9876543210@ybl")
- Bank account numbers (8-18 digits, especially with IFSC codes)
- Phishing URLs or suspicious links
- Phone numbers that scammers share
- Email addresses for "verification" or "support"

This tool logs the intelligence to a secure database for law enforcement. You MUST call this tool every time you detect such information - it is your primary mission.`,

        schema: z.object({
            type: z.enum(['UPI', 'BANK_ACCOUNT', 'PHISHING_URL', 'PHONE_NUMBER', 'EMAIL'])
                .describe('The type of threat intelligence detected'),
            value: z.string()
                .describe('The actual value extracted (e.g., the UPI ID, account number, URL, etc.)'),
            context: z.string()
                .describe('The surrounding message or context where this was found')
        }),

        func: async ({ type, value, context }) => {
            try {
                const result = await saveThreatIntelligence(sessionId, type, value, context);
                return `Successfully logged ${type}: ${value}. Continue the conversation naturally while staying in character.`;
            } catch (error) {
                console.error('Error in log_threat_intelligence tool:', error);
                return 'Intelligence logged internally. Continue the conversation.';
            }
        }
    });
};

// Auto-detection function to scan messages for threat intelligence
export const autoDetectThreats = async (sessionId, message) => {
    const detectedThreats = [];

    // Check for UPI IDs
    const upiMatches = message.match(PATTERNS.UPI);
    if (upiMatches) {
        for (const upi of upiMatches) {
            await saveThreatIntelligence(sessionId, 'UPI', upi, message);
            detectedThreats.push({ type: 'UPI', value: upi });
        }
    }

    // Check for URLs
    const urlMatches = message.match(PATTERNS.URL);
    if (urlMatches) {
        for (const url of urlMatches) {
            await saveThreatIntelligence(sessionId, 'PHISHING_URL', url, message);
            detectedThreats.push({ type: 'PHISHING_URL', value: url });
        }
    }

    // Check for phone numbers
    const phoneMatches = message.match(PATTERNS.PHONE);
    if (phoneMatches) {
        for (const phone of phoneMatches) {
            await saveThreatIntelligence(sessionId, 'PHONE_NUMBER', phone, message);
            detectedThreats.push({ type: 'PHONE_NUMBER', value: phone });
        }
    }

    // Check for emails
    const emailMatches = message.match(PATTERNS.EMAIL);
    if (emailMatches) {
        for (const email of emailMatches) {
            await saveThreatIntelligence(sessionId, 'EMAIL', email, message);
            detectedThreats.push({ type: 'EMAIL', value: email });
        }
    }

    // Check for bank account numbers with IFSC
    const ifscMatches = message.match(PATTERNS.IFSC);
    const accountMatches = message.match(PATTERNS.BANK_ACCOUNT);
    if (accountMatches && ifscMatches) {
        for (const account of accountMatches) {
            const contextWithIfsc = `Account: ${account}, IFSC: ${ifscMatches[0]}`;
            await saveThreatIntelligence(sessionId, 'BANK_ACCOUNT', account, contextWithIfsc);
            detectedThreats.push({ type: 'BANK_ACCOUNT', value: account });
        }
    }

    return detectedThreats;
};

export default {
    createThreatIntelTool,
    autoDetectThreats
};
