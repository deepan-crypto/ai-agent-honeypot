import express from 'express';
import twilio from 'twilio';
import { getSupabase } from '../config/database.js';
import {
    createSession,
    getSession,
    updateSession,
    generateResponse
} from '../services/aiAgent.service.js';

const router = express.Router();

// Store mapping of phone numbers to session IDs
const phoneToSession = new Map();

/**
 * Find or create session for a phone number
 */
const getOrCreateSessionForPhone = async (phoneNumber) => {
    // Check if we already have a session for this number
    if (phoneToSession.has(phoneNumber)) {
        const sessionId = phoneToSession.get(phoneNumber);
        try {
            await getSession(sessionId);
            return sessionId;
        } catch (error) {
            // Session doesn't exist, create new one
            phoneToSession.delete(phoneNumber);
        }
    }

    // Create new session
    const initialHistory = [
        {
            role: 'system',
            content: 'WhatsApp conversation initiated with potential scammer'
        }
    ];

    const { sessionId } = await createSession(initialHistory);
    phoneToSession.set(phoneNumber, sessionId);

    // Store phone number in database
    const supabase = getSupabase();
    await supabase
        .from('sessions')
        .update({
            chat_history: [...initialHistory, {
                role: 'system',
                content: `Phone: ${phoneNumber}`,
                timestamp: new Date().toISOString()
            }]
        })
        .eq('session_id', sessionId);

    return sessionId;
};

/**
 * POST /api/whatsapp/incoming
 * Webhook for incoming WhatsApp messages from Twilio
 */
router.post('/incoming', async (req, res) => {
    try {
        const { From, Body, ProfileName } = req.body;

        console.log(`📱 WhatsApp message from ${ProfileName || From}: ${Body}`);

        // Get or create session for this phone number
        const sessionId = await getOrCreateSessionForPhone(From);

        // Update session with user message
        await updateSession(sessionId, Body, 'user');

        // Generate AI response
        const { response, detectedThreats } = await generateResponse(sessionId, Body);

        console.log(`🤖 Martha responds: ${response}`);
        if (detectedThreats.length > 0) {
            console.log(`🚨 Threats detected: ${detectedThreats.map(t => `${t.type}: ${t.value}`).join(', ')}`);
        }

        // Send response via Twilio
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(response);

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

    } catch (error) {
        console.error('Error processing WhatsApp message:', error);

        // Send error message to user
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message('I\'m sorry dear, I\'m having trouble with my phone right now. Can you try again in a moment?');

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
});

/**
 * POST /api/whatsapp/status
 * Webhook for message status updates (optional)
 */
router.post('/status', (req, res) => {
    const { MessageStatus, To, MessageSid } = req.body;
    console.log(`📊 Message ${MessageSid} to ${To}: ${MessageStatus}`);
    res.sendStatus(200);
});

/**
 * GET /api/whatsapp/sessions
 * Get all active WhatsApp sessions
 */
router.get('/sessions', async (req, res) => {
    try {
        const sessions = Array.from(phoneToSession.entries()).map(([phone, sessionId]) => ({
            phoneNumber: phone,
            sessionId
        }));

        res.json({
            success: true,
            data: {
                activeSessions: sessions.length,
                sessions
            }
        });
    } catch (error) {
        console.error('Error fetching WhatsApp sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sessions'
        });
    }
});

export default router;
