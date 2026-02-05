import { ApiError } from './errorHandler.js';

// Validate handoff request
export const validateHandoffRequest = (req, res, next) => {
    const { chatHistory } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory)) {
        throw new ApiError(400, 'chatHistory must be an array');
    }

    if (chatHistory.length === 0) {
        throw new ApiError(400, 'chatHistory cannot be empty');
    }

    // Validate each message in chat history
    for (const message of chatHistory) {
        if (!message.role || !message.content) {
            throw new ApiError(400, 'Each message must have role and content fields');
        }
        if (!['user', 'assistant', 'system'].includes(message.role)) {
            throw new ApiError(400, 'Message role must be user, assistant, or system');
        }
    }

    next();
};

// Validate message request
export const validateMessageRequest = (req, res, next) => {
    const { sessionId, message } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
        throw new ApiError(400, 'sessionId is required and must be a string');
    }

    if (!message || typeof message !== 'string') {
        throw new ApiError(400, 'message is required and must be a string');
    }

    if (message.trim().length === 0) {
        throw new ApiError(400, 'message cannot be empty');
    }

    if (message.length > 5000) {
        throw new ApiError(400, 'message is too long (max 5000 characters)');
    }

    next();
};

// Validate session ID parameter
export const validateSessionId = (req, res, next) => {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string') {
        throw new ApiError(400, 'Invalid session ID');
    }

    next();
};
