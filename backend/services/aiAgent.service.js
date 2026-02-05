import Anthropic from '@anthropic-ai/sdk';
import VICTIM_PERSONA_PROMPT from '../prompts/victimPersona.js';
import { createThreatIntelTool, autoDetectThreats } from '../tools/threatIntel.tool.js';
import { getSupabase } from '../config/database.js';

// Initialize Anthropic client
let anthropicClient = null;

const initializeAnthropic = () => {
    if (!anthropicClient) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY not found in environment variables');
        }
        anthropicClient = new Anthropic({ apiKey });
    }
    return anthropicClient;
};

// Create a new agent session
export const createSession = async (chatHistory) => {
    try {
        const supabase = getSupabase();
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Format chat history for storage
        const formattedHistory = chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString()
        }));

        // Create session in database
        const { data, error } = await supabase
            .from('sessions')
            .insert([
                {
                    session_id: sessionId,
                    is_active: true,
                    persona_name: 'Martha',
                    chat_history: formattedHistory,
                    started_at: new Date().toISOString(),
                    last_activity: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Error creating session:', error);
            throw error;
        }

        console.log(`✅ Created new session: ${sessionId}`);
        return {
            sessionId,
            session: data[0]
        };
    } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
    }
};

// Get session from database
export const getSession = async (sessionId) => {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error) {
            console.error('Error fetching session:', error);
            throw new Error('Session not found');
        }

        return data;
    } catch (error) {
        console.error('Failed to get session:', error);
        throw error;
    }
};

// Update session with new message
export const updateSession = async (sessionId, newMessage, role = 'user') => {
    try {
        const supabase = getSupabase();
        const session = await getSession(sessionId);

        const updatedHistory = [
            ...session.chat_history,
            {
                role,
                content: newMessage,
                timestamp: new Date().toISOString()
            }
        ];

        const { data, error } = await supabase
            .from('sessions')
            .update({
                chat_history: updatedHistory,
                last_activity: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .select();

        if (error) {
            console.error('Error updating session:', error);
            throw error;
        }

        return data[0];
    } catch (error) {
        console.error('Failed to update session:', error);
        throw error;
    }
};

// Generate AI response using Claude with tool calling
export const generateResponse = async (sessionId, userMessage) => {
    try {
        const client = initializeAnthropic();

        // Auto-detect threats in the incoming message
        const detectedThreats = await autoDetectThreats(sessionId, userMessage);
        console.log(`🔍 Auto-detected ${detectedThreats.length} threats in message`);

        // Get session and build conversation history
        const session = await getSession(sessionId);
        const conversationHistory = session.chat_history.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content
        }));

        // Add the new user message
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // Create the threat intelligence tool
        const threatTool = createThreatIntelTool(sessionId);

        // Convert LangChain tool to Claude tool format
        const claudeTools = [
            {
                name: threatTool.name,
                description: threatTool.description,
                input_schema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['UPI', 'BANK_ACCOUNT', 'PHISHING_URL', 'PHONE_NUMBER', 'EMAIL'],
                            description: 'The type of threat intelligence detected'
                        },
                        value: {
                            type: 'string',
                            description: 'The actual value extracted (e.g., the UPI ID, account number, URL, etc.)'
                        },
                        context: {
                            type: 'string',
                            description: 'The surrounding message or context where this was found'
                        }
                    },
                    required: ['type', 'value', 'context']
                }
            }
        ];

        console.log('🤖 Generating AI response...');

        // Call Claude API with tool support
        let response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: VICTIM_PERSONA_PROMPT,
            messages: conversationHistory,
            tools: claudeTools
        });

        let finalResponse = '';
        let toolCalls = [];

        // Handle tool calls if any
        while (response.stop_reason === 'tool_use') {
            const toolUse = response.content.find(block => block.type === 'tool_use');

            if (toolUse) {
                console.log(`🔧 AI called tool: ${toolUse.name}`);
                console.log(`📊 Tool input:`, toolUse.input);

                // Execute the tool
                const toolResult = await threatTool.func(toolUse.input);
                toolCalls.push({
                    tool: toolUse.name,
                    input: toolUse.input,
                    result: toolResult
                });

                // Continue the conversation with tool result
                conversationHistory.push({
                    role: 'assistant',
                    content: response.content
                });

                conversationHistory.push({
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: toolUse.id,
                            content: toolResult
                        }
                    ]
                });

                // Get next response
                response = await client.messages.create({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1024,
                    system: VICTIM_PERSONA_PROMPT,
                    messages: conversationHistory,
                    tools: claudeTools
                });
            } else {
                break;
            }
        }

        // Extract final text response
        const textBlock = response.content.find(block => block.type === 'text');
        finalResponse = textBlock ? textBlock.text : 'I\'m sorry dear, I got a bit confused there. Could you repeat that?';

        console.log('✅ AI response generated successfully');

        // Update session with AI response
        await updateSession(sessionId, finalResponse, 'assistant');

        return {
            response: finalResponse,
            toolCalls,
            detectedThreats
        };
    } catch (error) {
        console.error('Error generating AI response:', error);
        throw error;
    }
};

// Get all threat intelligence for a session
export const getSessionIntelligence = async (sessionId) => {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('threat_intel')
            .select('*')
            .eq('session_id', sessionId)
            .order('extracted_at', { ascending: false });

        if (error) {
            console.error('Error fetching intelligence:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to get session intelligence:', error);
        throw error;
    }
};

export default {
    createSession,
    getSession,
    updateSession,
    generateResponse,
    getSessionIntelligence
};
