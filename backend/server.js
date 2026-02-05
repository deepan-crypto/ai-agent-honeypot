import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { initializeDatabase } from './config/database.js';
import agentRoutes from './routes/agent.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import competitionRoutes from './routes/competition.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ai-agent-honeypot.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Agentic Honeypot API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Competition API routes (mounted at root for /detect endpoint)
app.use('/', competitionRoutes);

// API routes
app.use('/api', agentRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Agentic AI Honeypot API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
            handoff: 'POST /api/handoff',
            message: 'POST /api/message',
            sessions: 'GET /api/sessions',
            sessionDetails: 'GET /api/sessions/:sessionId',
            intelligence: 'GET /api/intel',
            health: 'GET /health',
            whatsappIncoming: 'POST /api/whatsapp/incoming',
            whatsappSessions: 'GET /api/whatsapp/sessions'
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('🚀 Starting Agentic AI Honeypot Backend...');

        // Initialize Supabase connection
        initializeDatabase();

        // Verify required environment variables
        const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY'];
        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingEnvVars.length > 0) {
            console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
            console.error('Please check your .env file');
            process.exit(1);
        }

        // Start Express server
        app.listen(PORT, () => {
            // Detect deployment URL
            const isProduction = process.env.NODE_ENV === 'production';
            const deployUrl = process.env.RENDER_EXTERNAL_URL ||
                process.env.RAILWAY_STATIC_URL ||
                `http://localhost:${PORT}`;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

            if (isProduction && process.env.RENDER_EXTERNAL_URL) {
                console.log(`📡 API Base URL: ${deployUrl}/api`);
                console.log(`🏥 Health Check: ${deployUrl}/health`);
                console.log(`� Service URL: ${deployUrl}`);
            } else {
                console.log(`�📡 API Base URL: http://localhost:${PORT}/api`);
                console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();

export default app;
