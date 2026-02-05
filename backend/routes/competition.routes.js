import express from 'express';
import {
    createSessionWithId,
    getSession,
    updateSession,
    generateResponse
} from '../services/aiAgent.service.js';
import { validateCompetitionRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /detect
 * Competition API endpoint for scam detection
 * Accepts competition format and returns simplified response
 */
router.post('/detect', validateCompetitionRequest, async (req, res, next) => {
    try {
        const { sessionId, message, conversationHistory, metadata } = req.body;

        console.log(`🎯 Competition API request received for session: ${sessionId}`);
        console.log(`📱 Channel: ${metadata?.channel}, Language: ${metadata?.language}`);

        // Check if session exists
        let session;
        try {
            session = await getSession(sessionId);
            console.log(`✅ Found existing session: ${sessionId}`);
        } catch (error) {
            // Session doesn't exist, create a new one with conversation history
            console.log(`📝 Creating new session: ${sessionId}`);

            // Convert competition format conversation history to our format
            const chatHistory = conversationHistory.map(msg => ({
                role: msg.sender === 'scammer' ? 'user' : 'assistant',
                content: msg.text
            }));

            // If there's no history, start with a system message
            if (chatHistory.length === 0) {
                chatHistory.push({
                    role: 'system',
                    content: 'Honeypot session started'
                });
            }

            const result = await createSessionWithId(sessionId, chatHistory);
            session = result.session;
        }

        // Verify session is active
        if (!session.is_active) {
            throw new ApiError(400, 'Session is no longer active');
        }

        // Update session with the new scammer message
        await updateSession(sessionId, message.text, 'user');

        // Generate AI response from the honeypot agent
        const { response } = await generateResponse(sessionId, message.text);

        console.log(`✅ Generated response for session: ${sessionId}`);

        // Return in competition format
        res.status(200).json({
            status: 'success',
            reply: response
        });

    } catch (error) {
        console.error('Competition API error:', error);

        // Return error in competition format
        res.status(500).json({
            status: 'error',
            reply: 'I apologize dear, I seem to be having trouble right now. Could you try again?'
        });
    }
});

/**
 * GET /health
 * Health check endpoint for competition system
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Competition API is running',
        timestamp: new Date().toISOString()
    });
});

export default router;
