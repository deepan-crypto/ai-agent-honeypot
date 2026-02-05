# Agentic AI Honeypot Backend

A unified Node.js backend service that combines Express API with a LangChain-powered AI agent for trapping scammers and extracting threat intelligence.

## 🎯 Overview

This backend acts as a middle-layer where users can "hand off" scammer chats to an AI agent named "Martha" - a elderly persona designed to engage scammers, stall for time, and automatically extract threat intelligence like UPI IDs, bank account numbers, and phishing URLs.

## 🏗️ Architecture

- **Express API**: RESTful endpoints for session management
- **AI Agent**: Claude-powered agent with realistic victim persona
- **Supabase Database**: Stores sessions and threat intelligence
- **LangChain Tools**: Automatic threat detection and logging

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Anthropic API key (Claude)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Supabase Database

Go to your Supabase project's SQL Editor and run the schema:

```bash
# Copy and paste the contents of config/supabase-schema.sql
```

This creates:
- `sessions` table - Stores chat sessions
- `threat_intel` table - Stores extracted intelligence
- Indexes and triggers for performance

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# CORS
FRONTEND_URL=http://localhost:5173
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Initialize Agent Session (Handoff)
```http
POST /api/handoff
Content-Type: application/json

{
  "chatHistory": [
    { "role": "user", "content": "Hello, I need help with my bank account" },
    { "role": "assistant", "content": "Sure! Can you verify your details?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "message": "Oh hello dear! Yes, I can try to help...",
    "initialIntelligence": [],
    "toolCallsMade": 0
  }
}
```

### Send Message to Agent
```http
POST /api/message
Content-Type: application/json

{
  "sessionId": "session_1234567890_abc123",
  "message": "Please send money to scammer@paytm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "reply": "Oh my, let me find my glasses first...",
    "intelExtracted": true,
    "threats": [
      { "type": "UPI", "value": "scammer@paytm" }
    ],
    "toolCallsMade": 1
  }
}
```

### Get Session Details
```http
GET /api/sessions/:sessionId
```

### Get All Sessions
```http
GET /api/sessions?isActive=true&limit=50&offset=0
```

### Get Threat Intelligence
```http
GET /api/intel?type=UPI&severity=high&limit=100
```

### Deactivate Session
```http
PATCH /api/sessions/:sessionId/deactivate
```

## 🤖 AI Agent Features

### Martha Persona
- 68-year-old retired teacher
- Trusting but technologically confused
- Uses natural stalling tactics
- Maintains character throughout conversation

### Stalling Tactics
- Physical delays ("Can't find my glasses")
- Technical difficulties ("Internet is slow")
- Seeking help from family members
- Repetitive questions
- Off-topic conversations

### Automatic Threat Detection
The AI automatically detects and logs:
- **UPI IDs**: `name@paytm`, `number@ybl`, etc.
- **Bank Accounts**: 8-18 digit numbers with IFSC codes
- **Phishing URLs**: Any suspicious links
- **Phone Numbers**: Contact numbers shared by scammers
- **Email Addresses**: Email addresses for "verification"

## 🗄️ Database Schema

### Sessions Table
```sql
- id (UUID)
- session_id (VARCHAR, unique)
- is_active (BOOLEAN)
- persona_name (VARCHAR)
- chat_history (JSONB)
- started_at (TIMESTAMP)
- last_activity (TIMESTAMP)
```

### Threat Intel Table
```sql
- id (UUID)
- session_id (VARCHAR, foreign key)
- type (ENUM: UPI, BANK_ACCOUNT, PHISHING_URL, etc.)
- value (TEXT)
- context (TEXT)
- severity (ENUM: low, medium, high, critical)
- extracted_at (TIMESTAMP)
```

## 🚢 Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your repository
5. Render will automatically detect `render.yaml`
6. Add environment variables in Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `FRONTEND_URL`
7. Click "Apply" to deploy

### Option 2: Manual Setup

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: agentic-honeypot-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add environment variables (same as above)
6. Click "Create Web Service"

Your API will be live at: `https://your-service-name.onrender.com`

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for your frontend
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All requests validated
- **Error Handling**: Secure error messages (no stack traces in production)

## 📊 Monitoring

Check the health endpoint:
```bash
curl https://your-api.onrender.com/health
```

View logs in Render dashboard for:
- Session creation
- Threat detection
- Tool calls
- Errors

## 🛠️ Development

### Project Structure
```
backend/
├── server.js                 # Express app entry point
├── package.json
├── .env
├── config/
│   ├── database.js          # Supabase client
│   └── supabase-schema.sql  # Database schema
├── routes/
│   └── agent.routes.js      # API endpoints
├── services/
│   └── aiAgent.service.js   # AI agent logic
├── prompts/
│   └── victimPersona.js     # Martha persona
├── tools/
│   └── threatIntel.tool.js  # Threat detection
└── middleware/
    ├── errorHandler.js      # Error handling
    └── validation.js        # Request validation
```

### Adding New Features

1. **New Tool**: Add to `tools/` directory
2. **New Route**: Add to `routes/agent.routes.js`
3. **Update Persona**: Edit `prompts/victimPersona.js`
4. **New Detection Pattern**: Update `tools/threatIntel.tool.js`

## 📝 License

MIT

## 🙏 Credits

Built with:
- [Express.js](https://expressjs.com/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Supabase](https://supabase.com/)
- [LangChain](https://js.langchain.com/)

---

**⚠️ Important**: This system is designed for educational and law enforcement purposes only. Always comply with local laws regarding scam prevention and data collection.
