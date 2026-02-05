import express from 'express';
import {
    createSession,
    getSession,
    updateSession,
    generateResponse,
    getSessionIntelligence
} from '../services/aiAgent.service.js';
import {
    validateHandoffRequest,
    validateMessageRequest,
    validateSessionId
} from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getSupabase } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/handoff
 * Initialize a new AI agent session with existing chat history
 */
router.post('/handoff', validateHandoffRequest, async (req, res, next) => {
    try {
        const { chatHistory } = req.body;

        console.log('📥 Handoff request received with', chatHistory.length, 'messages');

        // Create new session with chat history
        const { sessionId, session } = await createSession(chatHistory);

        // Generate initial AI response
        const lastUserMessage = chatHistory[chatHistory.length - 1].content;
        const { response, toolCalls, detectedThreats } = await generateResponse(sessionId, lastUserMessage);

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                message: response,
                initialIntelligence: detectedThreats,
                toolCallsMade: toolCalls.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/message
 * Send a message to an existing session and get AI response
 */
router.post('/message', validateMessageRequest, async (req, res, next) => {
    try {
        const { sessionId, message } = req.body;

        console.log(`📨 Message received for session: ${sessionId}`);

        // Verify session exists and is active
        const session = await getSession(sessionId);
        if (!session.is_active) {
            throw new ApiError(400, 'Session is no longer active');
        }

        // Update session with user message
        await updateSession(sessionId, message, 'user');

        // Generate AI response
        const { response, toolCalls, detectedThreats } = await generateResponse(sessionId, message);

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                reply: response,
                intelExtracted: detectedThreats.length > 0,
                threats: detectedThreats,
                toolCallsMade: toolCalls.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sessions/:sessionId
 * Retrieve full session details including chat history
 */
router.get('/sessions/:sessionId', validateSessionId, async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const session = await getSession(sessionId);
        const intelligence = await getSessionIntelligence(sessionId);

        res.status(200).json({
            success: true,
            data: {
                session,
                intelligenceCount: intelligence.length,
                intelligence
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/intel
 * Retrieve all threat intelligence with optional filters
 */
router.get('/intel', async (req, res, next) => {
    try {
        const { type, sessionId, severity, limit = 100 } = req.query;
        const supabase = getSupabase();

        let query = supabase
            .from('threat_intel')
            .select('*')
            .order('extracted_at', { ascending: false })
            .limit(parseInt(limit));

        // Apply filters
        if (type) {
            query = query.eq('type', type);
        }
        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }
        if (severity) {
            query = query.eq('severity', severity);
        }

        const { data, error } = await query;

        if (error) {
            throw new ApiError(500, 'Failed to fetch intelligence data');
        }

        res.status(200).json({
            success: true,
            data: {
                count: data.length,
                intelligence: data
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/sessions/:sessionId/deactivate
 * Deactivate a session (end the honeypot interaction)
 */
router.patch('/sessions/:sessionId/deactivate', validateSessionId, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('sessions')
            .update({ is_active: false })
            .eq('session_id', sessionId)
            .select();

        if (error) {
            throw new ApiError(500, 'Failed to deactivate session');
        }

        res.status(200).json({
            success: true,
            message: 'Session deactivated successfully',
            data: data[0]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sessions
 * Get all sessions with pagination
 */
router.get('/sessions', async (req, res, next) => {
    try {
        const { isActive, limit = 50, offset = 0 } = req.query;
        const supabase = getSupabase();

        let query = supabase
            .from('sessions')
            .select('*', { count: 'exact' })
            .order('started_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error, count } = await query;

        if (error) {
            throw new ApiError(500, 'Failed to fetch sessions');
        }

        res.status(200).json({
            success: true,
            data: {
                sessions: data,
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
